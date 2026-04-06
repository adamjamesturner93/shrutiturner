import { createHash } from "node:crypto";
import { PrivacyRequestStatus, PrivacyRequestType, Prisma } from "@prisma/client";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { db } from "@/lib/db";

function buildChecksum(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function anonymizedEmail(userId: string) {
  return `deleted+${userId}@redacted.invalid`;
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
  };
}

export async function createPrivacyExportRequest(actorUserId: string, userId: string) {
  const exportData = await buildUserExportData(userId);
  const serialized = JSON.stringify(exportData);
  const checksum = buildChecksum(serialized);

  const request = await db.privacyRequest.create({
    data: {
      userId,
      actorUserId,
      type: PrivacyRequestType.export,
      status: PrivacyRequestStatus.completed,
      generatedAt: new Date(),
      summaryChecksum: checksum,
      summaryJson: exportData as Prisma.InputJsonValue,
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
    },
  });

  return {
    request,
    exportData,
    checksum,
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
