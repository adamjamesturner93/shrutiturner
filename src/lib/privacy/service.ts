import { createHash } from "node:crypto";
import { PrivacyRequestStatus, PrivacyRequestType, Prisma } from "@prisma/client";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { db } from "@/lib/db";
import { createZipArchive } from "@/lib/privacy/zip";

function buildChecksum(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function anonymizedEmail(userId: string) {
  return `deleted+${userId}@redacted.invalid`;
}

function toJsonString(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function countRows(value: unknown) {
  if (Array.isArray(value)) return value.length;
  return value ? 1 : 0;
}

export async function buildUserExportData(userId: string) {
  const [
    user,
    bookings,
    attendance,
    memberships,
    newsletter,
    comments,
    reactions,
    healthProfile,
    healthRevisions,
    acceptances,
    retreatBookings,
    smallGroups,
    billingEvents,
    privacyRequests,
    coachingApplications,
    contactSubmissions,
    giftPurchases,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: {
        notificationPreference: true,
      },
    }),
    db.classBooking.findMany({
      where: { userId },
      include: {
        session: {
          select: {
            id: true,
            titleSnapshot: true,
            startsAtUtc: true,
            endsAtUtc: true,
          },
        },
      },
      orderBy: { bookedAt: "desc" },
    }),
    db.classAttendanceEvent.findMany({
      where: { userId },
      orderBy: { occurredAt: "desc" },
    }),
    db.membershipSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    db.newsletterSubscriber.findUnique({
      where: { userId },
    }),
    db.blogComment.findMany({
      where: { authorUserId: userId },
      orderBy: { createdAt: "desc" },
    }),
    db.blogReaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    db.healthProfile.findUnique({
      where: { userId },
      include: {
        selections: true,
      },
    }),
    db.healthProfileRevision.findMany({
      where: {
        profile: {
          userId,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.acceptanceEvent.findMany({
      where: { userId },
      orderBy: { acceptedAt: "desc" },
    }),
    db.retreatBooking.findMany({
      where: {
        OR: [{ purchaserUserId: userId }, { attendeeUserId: userId }],
      },
      orderBy: { bookedAt: "desc" },
    }),
    db.smallGroupProgrammeEnrollment.findMany({
      where: { userId },
      include: {
        programme: {
          select: {
            id: true,
            title: true,
            runSlug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.billingEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    db.privacyRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    db.coachingApplication.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    db.contactSubmission.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    db.giftPurchase.findMany({
      where: {
        OR: [{ purchaserUserId: userId }, { redeemedByUserId: userId }],
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    account: user,
    classBookings: bookings,
    attendance,
    memberships,
    billingEvents,
    newsletter,
    blogComments: comments,
    blogReactions: reactions,
    healthProfile,
    healthRevisions,
    consentHistory: acceptances,
    retreatBookings,
    smallGroupEnrollments: smallGroups,
    privacyRequests,
    coachingApplications,
    contactSubmissions,
    giftPurchases,
  };
}

type PrivacyExportData = Awaited<ReturnType<typeof buildUserExportData>>;

type PrivacyExportManifest = {
  requestId: string;
  userId: string;
  actorUserId: string;
  generatedAt: string;
  checksum: string;
  includedSections: string[];
  rowCounts: Record<string, number>;
};

function getPrivacyExportSections(exportData: PrivacyExportData) {
  return [
    { key: "account", fileName: "account.json", data: exportData.account },
    { key: "newsletter", fileName: "newsletter.json", data: exportData.newsletter },
    { key: "memberships", fileName: "memberships.json", data: exportData.memberships },
    { key: "billing-events", fileName: "billing-events.json", data: exportData.billingEvents },
    { key: "class-bookings", fileName: "class-bookings.json", data: exportData.classBookings },
    { key: "attendance", fileName: "attendance.json", data: exportData.attendance },
    { key: "health-profile", fileName: "health-profile.json", data: exportData.healthProfile },
    { key: "health-revisions", fileName: "health-revisions.json", data: exportData.healthRevisions },
    { key: "consent-history", fileName: "consent-history.json", data: exportData.consentHistory },
    { key: "retreat-bookings", fileName: "retreat-bookings.json", data: exportData.retreatBookings },
    {
      key: "small-group-enrolments",
      fileName: "small-group-enrolments.json",
      data: exportData.smallGroupEnrollments,
    },
    { key: "blog-comments", fileName: "blog-comments.json", data: exportData.blogComments },
    { key: "blog-reactions", fileName: "blog-reactions.json", data: exportData.blogReactions },
    {
      key: "privacy-requests",
      fileName: "privacy-requests.json",
      data: exportData.privacyRequests,
    },
    {
      key: "coaching-applications",
      fileName: "coaching-applications.json",
      data: exportData.coachingApplications,
    },
    {
      key: "contact-submissions",
      fileName: "contact-submissions.json",
      data: exportData.contactSubmissions,
    },
    { key: "gift-purchases", fileName: "gift-purchases.json", data: exportData.giftPurchases },
  ] as const;
}

function buildPrivacyExportMetadata(exportData: PrivacyExportData) {
  const sections = getPrivacyExportSections(exportData);
  const includedSections = sections.map((section) => section.key);
  const rowCounts = Object.fromEntries(
    sections.map((section) => [section.key, countRows(section.data)])
  );

  return {
    includedSections,
    rowCounts,
  };
}

function buildPrivacyExportReadme(manifest: PrivacyExportManifest) {
  return [
    "Shruti Turner privacy export",
    "",
    `Request ID: ${manifest.requestId}`,
    `Subject user ID: ${manifest.userId}`,
    `Generated at: ${manifest.generatedAt}`,
    `Checksum: ${manifest.checksum}`,
    "",
    "Files included:",
    ...manifest.includedSections.map(
      (section) => `- ${section} (${manifest.rowCounts[section] || 0} record(s))`
    ),
    "",
    "This package is generated for privacy-access handling and contains the server-side records",
    "currently associated with the subject account in the live platform.",
  ].join("\n");
}

function buildPrivacyExportArchive(input: {
  requestId: string;
  userId: string;
  actorUserId: string;
  generatedAt: Date;
  checksum: string;
  exportData: PrivacyExportData;
  includedSections: string[];
  rowCounts: Record<string, number>;
}) {
  const manifest: PrivacyExportManifest = {
    requestId: input.requestId,
    userId: input.userId,
    actorUserId: input.actorUserId,
    generatedAt: input.generatedAt.toISOString(),
    checksum: input.checksum,
    includedSections: input.includedSections,
    rowCounts: input.rowCounts,
  };

  const entries = [
    {
      name: "README.txt",
      data: buildPrivacyExportReadme(manifest),
      modifiedAt: input.generatedAt,
    },
    {
      name: "manifest.json",
      data: toJsonString(manifest),
      modifiedAt: input.generatedAt,
    },
    {
      name: "summary.json",
      data: toJsonString({
        exportedAt: input.exportData.exportedAt,
        includedSections: input.includedSections,
        rowCounts: input.rowCounts,
      }),
      modifiedAt: input.generatedAt,
    },
    ...getPrivacyExportSections(input.exportData).map((section) => ({
      name: section.fileName,
      data: toJsonString(section.data),
      modifiedAt: input.generatedAt,
    })),
  ];

  return createZipArchive(entries);
}

function toExportDownloadFileName(userId: string, requestId: string) {
  return `privacy-export-${userId}-${requestId}.zip`;
}

export async function createPrivacyExportRequest(actorUserId: string, userId: string) {
  const exportData = await buildUserExportData(userId);
  const serialized = JSON.stringify(exportData);
  const checksum = buildChecksum(serialized);
  const generatedAt = new Date();
  const metadata = buildPrivacyExportMetadata(exportData);

  const request = await db.privacyRequest.create({
    data: {
      userId,
      actorUserId,
      type: PrivacyRequestType.export,
      status: PrivacyRequestStatus.completed,
      generatedAt,
      summaryChecksum: checksum,
      summaryJson: exportData as Prisma.InputJsonValue,
      exportSectionsJson: metadata.includedSections as Prisma.InputJsonValue,
      exportRowCountsJson: metadata.rowCounts as Prisma.InputJsonValue,
    },
  });

  await createAdminActionLog({
    actorUserId,
    actionType: "privacy_export_generated",
    targetType: "privacy_request",
    targetId: request.id,
    metadataJson: {
      userId,
      checksum,
      sections: metadata.includedSections,
      rowCounts: metadata.rowCounts,
    },
  });

  return {
    request,
    checksum,
    includedSections: metadata.includedSections,
    rowCounts: metadata.rowCounts,
    fileName: toExportDownloadFileName(userId, request.id),
  };
}

export async function downloadPrivacyExportRequest(requestId: string) {
  const request = await db.privacyRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.type !== PrivacyRequestType.export) {
    throw new Error("NOT_FOUND");
  }

  if (
    request.status !== PrivacyRequestStatus.completed ||
    !request.generatedAt ||
    !request.summaryChecksum ||
    !request.summaryJson
  ) {
    throw new Error("EXPORT_NOT_READY");
  }

  const exportData = request.summaryJson as unknown as PrivacyExportData;
  const metadata = buildPrivacyExportMetadata(exportData);
  const archive = buildPrivacyExportArchive({
    requestId: request.id,
    userId: request.userId,
    actorUserId: request.actorUserId,
    generatedAt: request.generatedAt,
    checksum: request.summaryChecksum,
    exportData,
    includedSections:
      (Array.isArray(request.exportSectionsJson)
        ? request.exportSectionsJson.map((section) => String(section))
        : metadata.includedSections) || metadata.includedSections,
    rowCounts:
      (request.exportRowCountsJson as Record<string, number> | null) || metadata.rowCounts,
  });

  return {
    request,
    fileName: toExportDownloadFileName(request.userId, request.id),
    contentType: "application/zip",
    archive,
  };
}

export async function previewPrivacyDeletion(userId: string) {
  const [openDisputes, sessions, healthProfile, retreatBookings, programmeEnrollments] =
    await Promise.all([
      db.billingDisputeCase.count({
        where: {
          userId,
          status: "open",
        },
      }),
      db.session.count({ where: { userId } }),
      db.healthProfile.findUnique({
        where: { userId },
        select: { id: true },
      }),
      db.retreatBooking.count({
        where: {
          OR: [{ purchaserUserId: userId }, { attendeeUserId: userId }],
        },
      }),
      db.smallGroupProgrammeEnrollment.count({ where: { userId } }),
    ]);

  return {
    userId,
    blocked: openDisputes > 0,
    blockReason: openDisputes > 0 ? "Active dispute hold" : null,
    summary: {
      authSessions: sessions,
      hasHealthProfile: Boolean(healthProfile),
      retreatBookings,
      programmeEnrollments,
    },
    deletes: [
      "Active Auth.js sessions",
      "Health profile revisions",
      "Structured health condition selections",
      "Live health profile record",
    ],
    anonymises: [
      "Core account profile fields",
      "Retreat booking personal and health fields",
      "Small-group attendee identity fields",
      "Coaching application answers and notes",
      "Contact submissions",
      "Newsletter subscriber identity",
    ],
    preserves: [
      "Finance and payment records",
      "Dispute and audit trails",
      "Membership and booking identifiers",
      "Privacy request records",
    ],
  };
}

export async function executePrivacyDeletion(actorUserId: string, userId: string) {
  const preview = await previewPrivacyDeletion(userId);
  const request = await db.privacyRequest.create({
    data: {
      userId,
      actorUserId,
      type: PrivacyRequestType.deletion,
      status: preview.blocked ? PrivacyRequestStatus.blocked : PrivacyRequestStatus.pending,
      blockReason: preview.blockReason,
      summaryJson: preview.summary as Prisma.InputJsonValue,
    },
  });

  if (preview.blocked) {
    await createAdminActionLog({
      actorUserId,
      actionType: "privacy_deletion_blocked",
      targetType: "privacy_request",
      targetId: request.id,
      reason: preview.blockReason,
      metadataJson: { userId },
    });
    throw new Error("PRIVACY_DELETION_BLOCKED");
  }

  const replacementEmail = anonymizedEmail(userId);
  const executedAt = new Date();

  await db.$transaction(async (tx) => {
    await tx.session.deleteMany({
      where: { userId },
    });

    await tx.healthProfileRevision.deleteMany({
      where: {
        profile: {
          userId,
        },
      },
    });
    await tx.healthConditionSelection.deleteMany({
      where: {
        profile: {
          userId,
        },
      },
    });
    await tx.healthProfile.deleteMany({
      where: { userId },
    });

    await tx.coachingApplication.updateMany({
      where: { userId },
      data: {
        applicantFirstName: "Deleted",
        applicantLastName: "User",
        applicantEmail: replacementEmail,
        answersJson: {},
        adminNotes: null,
      },
    });

    await tx.contactSubmission.updateMany({
      where: { userId },
      data: {
        firstName: "Deleted",
        lastName: "User",
        email: replacementEmail,
        conditions: null,
        howFound: null,
        message: "[deleted]",
      },
    });

    await tx.newsletterSubscriber.updateMany({
      where: { userId },
      data: {
        email: replacementEmail,
        status: "unsubscribed",
        unsubscribedAt: executedAt,
      },
    });

    await tx.retreatBooking.updateMany({
      where: {
        OR: [{ purchaserUserId: userId }, { attendeeUserId: userId }],
      },
      data: {
        purchaserFirstName: "Deleted",
        purchaserLastName: "User",
        purchaserEmail: replacementEmail,
        attendeeFirstName: "Deleted",
        attendeeLastName: "User",
        attendeeEmail: replacementEmail,
        phone: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        dietaryRequirements: null,
        medicalConditions: null,
        mobilityNeeds: null,
        guestTwoFirstName: null,
        guestTwoLastName: null,
        guestTwoEmail: null,
        guestTwoDietaryRequirements: null,
      },
    });

    await tx.smallGroupProgrammeEnrollment.updateMany({
      where: { userId },
      data: {
        attendeeName: "Deleted User",
        attendeeEmail: replacementEmail,
        progressSummary: null,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        firstName: null,
        lastName: null,
        name: "Deleted User",
        email: replacementEmail,
        image: null,
        dob: null,
        gender: null,
        ethnicity: null,
        heardAboutSource: null,
        heardAboutDetail: null,
        adminNotes: null,
        instructorProfileEntryId: null,
        authCode: null,
        authCodeExpiry: null,
      },
    });

    await tx.privacyRequest.update({
      where: { id: request.id },
      data: {
        status: PrivacyRequestStatus.completed,
        executedAt,
      },
    });
  });

  await createAdminActionLog({
    actorUserId,
    actionType: "privacy_deletion_executed",
    targetType: "privacy_request",
    targetId: request.id,
    metadataJson: {
      userId,
      replacementEmail,
    },
  });

  return db.privacyRequest.findUniqueOrThrow({
    where: { id: request.id },
  });
}
