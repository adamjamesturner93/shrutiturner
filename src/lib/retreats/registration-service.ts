import "server-only";
import { db } from "@/lib/db";
import { getWorkshopSetupState } from "@/lib/retreats/workshop-setup";
import { isConfirmedRetreatBooking } from "@/lib/retreats/operations";
import { buildAbsoluteUrl } from "@/lib/app-url";
import { sendPostmarkReactEmail } from "@/lib/postmark/client";
import RetreatRegistrationEmail from "@/emails/retreat-registration";

export async function getAttendeeReadiness(
  attendee: { userId: string | null; email: string; practicalConfirmedAt: Date | null },
  residential: boolean
) {
  if (!attendee.userId)
    return { complete: false, missing: [attendee.email ? "account" : "guest_details"] };
  const setup = await getWorkshopSetupState(attendee.userId);
  const missing: string[] = [...setup.missing];
  if (residential && !attendee.practicalConfirmedAt) missing.push("practical_details");
  return { complete: missing.length === 0, missing };
}

async function findOwnAttendee(userId: string, attendeeId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerified: true, deletedAt: true },
  });
  if (!user || !user.emailVerified || user.deletedAt) throw new Error("NOT_FOUND");
  const attendee = await db.retreatAttendee.findFirst({
    where: {
      id: attendeeId,
      status: { not: "cancelled" },
      OR: [{ userId }, { userId: null, email: { equals: user.email, mode: "insensitive" } }],
    },
    include: { booking: { include: { retreatDate: true } } },
  });
  if (
    !attendee ||
    !isConfirmedRetreatBooking(attendee.booking.bookingStatus) ||
    attendee.booking.retreatDate.status === "cancelled"
  )
    throw new Error("NOT_FOUND");
  return attendee;
}

export async function getOwnRetreatRegistration(userId: string, attendeeId: string) {
  const attendee = await findOwnAttendee(userId, attendeeId);
  const setup = await getWorkshopSetupState(userId);
  return {
    attendeeId: attendee.id,
    bookingId: attendee.bookingId,
    title: attendee.booking.retreatDate.retreatTitleSnapshot,
    startsAt: attendee.booking.retreatDate.startsAt.toISOString(),
    timezone: attendee.booking.retreatDate.timezone,
    residential: attendee.booking.retreatDate.retreatType === "in_person",
    linked: attendee.userId === userId,
    setup,
    practical: {
      phone: attendee.phone || "",
      emergencyContactName: attendee.emergencyContactName || "",
      emergencyContactPhone: attendee.emergencyContactPhone || "",
      dietaryRequirements: attendee.dietaryRequirements || "",
      mobilityNeeds: attendee.mobilityNeeds || "",
    },
    practicalConfirmedAt: attendee.practicalConfirmedAt?.toISOString() || null,
  };
}

export async function saveOwnRetreatRegistration(
  userId: string,
  attendeeId: string,
  input: Record<string, unknown>
) {
  const attendee = await findOwnAttendee(userId, attendeeId);
  const residential = attendee.booking.retreatDate.retreatType === "in_person";
  const practical = Object.fromEntries(
    [
      "phone",
      "emergencyContactName",
      "emergencyContactPhone",
      "dietaryRequirements",
      "mobilityNeeds",
    ].map((key) => [
      key,
      typeof input[key] === "string"
        ? input[key]
            .trim()
            .slice(0, key.includes("Requirements") || key === "mobilityNeeds" ? 1000 : 120)
        : "",
    ])
  );
  if (
    residential &&
    (!practical.phone ||
      !practical.emergencyContactName ||
      !practical.emergencyContactPhone ||
      input.confirmed !== true)
  )
    throw new Error("INVALID_REGISTRATION");
  const saved = await db.retreatAttendee.updateMany({
    where: {
      id: attendee.id,
      status: { not: "cancelled" },
      OR: [{ userId }, { userId: null, email: { equals: attendee.email, mode: "insensitive" } }],
      booking: {
        bookingStatus: { in: ["deposit_paid", "balance_due", "paid_in_full"] },
        retreatDate: { status: { not: "cancelled" } },
      },
    },
    data: {
      userId,
      status: "claimed",
      claimedAt: attendee.claimedAt || new Date(),
      claimToken: null,
      ...(residential ? { ...practical, practicalConfirmedAt: new Date() } : {}),
    },
  });
  if (!saved.count) throw new Error("NOT_FOUND");
  return getOwnRetreatRegistration(userId, attendeeId);
}

export async function sendRetreatRegistrationInvitation(
  attendeeId: string,
  options: { retreatDateId?: string; automatic?: boolean } = {}
) {
  const attendee = await db.retreatAttendee.findUnique({
    where: { id: attendeeId },
    include: { booking: { include: { retreatDate: true } } },
  });
  if (
    !attendee ||
    (options.retreatDateId && attendee.booking.retreatDateId !== options.retreatDateId) ||
    !attendee.email ||
    attendee.status === "cancelled" ||
    !isConfirmedRetreatBooking(attendee.booking.bookingStatus) ||
    ["cancelled", "completed"].includes(attendee.booking.retreatDate.status) ||
    attendee.booking.retreatDate.endsAt <= new Date()
  )
    throw new Error("NOT_FOUND");
  const claimed = await db.retreatAttendee.updateMany({
    where: {
      id: attendee.id,
      ...(options.automatic
        ? { invitationQueuedAt: null }
        : {
            OR: [
              { invitationQueuedAt: null },
              { invitationQueuedAt: { lt: new Date(Date.now() - 60_000) } },
            ],
          }),
    },
    data: { invitationQueuedAt: new Date() },
  });
  if (!claimed.count) return { skipped: true };
  const path = `/dashboard/retreats/registration/${attendee.id}`;
  const url = buildAbsoluteUrl(`/login?redirect=${encodeURIComponent(path)}`);
  try {
    await sendPostmarkReactEmail({
      to: attendee.email,
      subject: `Complete your registration: ${attendee.booking.retreatDate.retreatTitleSnapshot}`,
      react: RetreatRegistrationEmail({
        name: attendee.firstName || "there",
        title: attendee.booking.retreatDate.retreatTitleSnapshot,
        url,
      }),
      textBody: `Complete your own registration for ${attendee.booking.retreatDate.retreatTitleSnapshot}: ${url}`,
      tag: "retreat-registration",
      templateKey: "retreat-registration",
      metadata: {
        attendeeId: attendee.id,
        bookingId: attendee.bookingId,
        retreatDateId: attendee.booking.retreatDateId,
      },
      dispatchMode: "immediate_best_effort",
    });
  } catch (error) {
    await db.retreatAttendee.update({
      where: { id: attendee.id },
      data: { invitationQueuedAt: null },
    });
    throw error;
  }
  return { skipped: false };
}

export async function inviteRetreatBookingAttendees(bookingId: string) {
  const attendees = await db.retreatAttendee.findMany({
    where: { bookingId, status: { not: "cancelled" } },
    select: { id: true },
  });
  const results = await Promise.allSettled(
    attendees.map((attendee) => sendRetreatRegistrationInvitation(attendee.id, { automatic: true }))
  );
  for (const result of results)
    if (result.status === "rejected")
      console.error("Retreat registration invitation failed", result.reason);
}

export async function getMyRetreatRegistrations(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerified: true },
  });
  if (!user?.emailVerified) return [];
  const attendees = await db.retreatAttendee.findMany({
    where: {
      status: { not: "cancelled" },
      OR: [{ userId }, { userId: null, email: { equals: user.email, mode: "insensitive" } }],
      booking: {
        bookingStatus: { in: ["deposit_paid", "balance_due", "paid_in_full"] },
        retreatDate: { status: { not: "cancelled" } },
      },
    },
    include: { booking: { include: { retreatDate: true } } },
    orderBy: { booking: { retreatDate: { startsAt: "asc" } } },
  });
  return Promise.all(
    attendees.map(async (attendee) => ({
      id: attendee.id,
      bookingId: attendee.booking.id,
      title: attendee.booking.retreatDate.retreatTitleSnapshot,
      startsAt: attendee.booking.retreatDate.startsAt.toISOString(),
      ...(await getAttendeeReadiness(
        attendee,
        attendee.booking.retreatDate.retreatType === "in_person"
      )),
    }))
  );
}

export async function getAdminRegistrationRows(retreatDateId: string) {
  const [attendees, deliveries] = await Promise.all([
    db.retreatAttendee.findMany({
      where: { booking: { retreatDateId } },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      include: { booking: { select: { retreatDate: { select: { retreatType: true } } } } },
    }),
    db.emailDelivery.findMany({
      where: {
        templateKey: "retreat-registration",
        metadataJson: { path: ["retreatDateId"], equals: retreatDateId },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        toEmail: true,
        status: true,
        createdAt: true,
        sentAt: true,
        metadataJson: true,
      },
    }),
  ]);
  return Promise.all(
    attendees.map(async (attendee) => {
      const readiness =
        attendee.status === "cancelled"
          ? { complete: false, missing: [] }
          : await getAttendeeReadiness(
              attendee,
              attendee.booking.retreatDate.retreatType === "in_person"
            );
      return {
        id: attendee.id,
        bookingId: attendee.bookingId,
        name: `${attendee.firstName} ${attendee.lastName}`.trim(),
        email: attendee.email,
        isPrimary: attendee.isPrimary,
        healthProfileHref: attendee.userId ? `/admin/members/${attendee.userId}` : null,
        accountLinked: Boolean(attendee.userId),
        status: attendee.status,
        ...readiness,
        phone: attendee.phone || "",
        emergencyContactName: attendee.emergencyContactName || "",
        emergencyContactPhone: attendee.emergencyContactPhone || "",
        dietaryRequirements: attendee.dietaryRequirements || "",
        mobilityNeeds: attendee.mobilityNeeds || "",
        practicalConfirmedAt: attendee.practicalConfirmedAt?.toISOString() || null,
        invitations: deliveries
          .filter((delivery) => {
            const metadata = delivery.metadataJson as Record<string, unknown> | null;
            return metadata?.attendeeId === attendee.id;
          })
          .map((delivery) => ({
            id: delivery.id,
            email: delivery.toEmail,
            status: delivery.status,
            requestedAt: delivery.createdAt.toISOString(),
            sentAt: delivery.sentAt?.toISOString() || null,
          })),
      };
    })
  );
}
