import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { canManageRetreatDate } from "@/lib/authz/access";
import { getHealthProfile } from "@/lib/health/health-service";
import {
  getAcceptanceRequirementStates,
  getPhysicalServiceAcceptanceRequirements,
  recordAcknowledgedAcceptances,
} from "@/lib/legal/acceptance-service";
import { currentClearanceStatus, exerciseCleared } from "@/lib/programmes/policy";
import { programmeNow } from "@/lib/programmes/clock";
import { confirmationSchema, reviewOfferingHealth } from "@/lib/programmes/clearance-service";

async function participantBooking(userId: string, bookingId: string) {
  const booking = await db.retreatBooking.findFirst({
    where: {
      id: bookingId,
      bookingStatus: { in: ["deposit_paid", "paid_in_full"] },
      OR: [{ attendeeUserId: userId }, { attendees: { some: { userId } } }],
    },
    include: { retreatDate: true },
  });
  if (!booking) throw new Error("NOT_FOUND");
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true, deletedAt: true },
  });
  if (!user?.emailVerified || user.deletedAt) throw new Error("FORBIDDEN");
  return booking;
}
export async function eventClearanceState(userId: string, retreatDateId: string) {
  const event = await db.retreatDate.findUniqueOrThrow({
    where: { id: retreatDateId },
    select: { requiresOfferingClearance: true },
  });
  if (!event.requiresOfferingClearance)
    return { required: false, status: "cleared" as const, canExercise: true };
  const [health, clearance] = await Promise.all([
    db.healthProfile.findUnique({ where: { userId } }),
    db.offeringClearance.findUnique({
      where: { userId_offeringKey: { userId, offeringKey: `event:${retreatDateId}` } },
    }),
  ]);
  const status = currentClearanceStatus(clearance, health?.lastUpdatedAt.toISOString() || null);
  return {
    required: true,
    status,
    canExercise: exerciseCleared(status) && !health?.reviewRequestedAt,
  };
}
export async function assertEventExerciseClearance(userId: string, retreatDateId: string) {
  if (!(await eventClearanceState(userId, retreatDateId)).canExercise)
    throw new Error("EXERCISE_CLEARANCE_REQUIRED");
}
export async function getEventOnboarding(userId: string, bookingId: string) {
  const b = await participantBooking(userId, bookingId);
  const [health, state, agreements] = await Promise.all([
    getHealthProfile(userId),
    eventClearanceState(userId, b.retreatDateId),
    getAcceptanceRequirementStates(
      userId,
      getPhysicalServiceAcceptanceRequirements("event_onboarding")
    ),
  ]);
  const profile = await db.healthProfile.findUnique({ where: { userId } });
  return {
    title: b.retreatDate.retreatTitleSnapshot,
    status: state.status,
    required: state.required,
    health,
    healthRevision: profile?.lastUpdatedAt.toISOString() || null,
    agreementVersion: "1",
    refundWording:
      "Your booking terms and cancellation policy remain available in your booking details.",
    agreements,
  };
}
export async function confirmEventHealth(userId: string, bookingId: string, raw: unknown) {
  const b = await participantBooking(userId, bookingId);
  const input = confirmationSchema.parse(raw);
  await recordAcknowledgedAcceptances({
    userId,
    surface: "event_onboarding",
    acceptances: input.acceptances,
  });
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "HealthProfile" WHERE "userId" = ${userId} FOR UPDATE`;
    const profile = await tx.healthProfile.findUnique({ where: { userId } });
    if (!profile || profile.lastUpdatedAt.toISOString() !== input.healthRevision)
      throw new Error("HEALTH_REVISION_CHANGED");
    const data = {
      healthRevision: input.healthRevision,
      confirmedAt: programmeNow(),
      status:
        profile.declarationStatus === "context_declared"
          ? ("pending_review" as const)
          : ("ready" as const),
    };
    await tx.healthProfile.update({
      where: { userId },
      data: { lastConfirmedAt: programmeNow(), reviewRequestedAt: null },
    });
    return tx.offeringClearance.upsert({
      where: { userId_offeringKey: { userId, offeringKey: `event:${b.retreatDateId}` } },
      create: { userId, offeringKey: `event:${b.retreatDateId}`, ...data },
      update: { ...data, reviewerId: null, reviewedAt: null, considerations: "" },
    });
  });
}
export async function getEventClearanceReviews(actorId: string, id: string) {
  if (!(await canManageRetreatDate(actorId, id))) throw new Error("FORBIDDEN");
  return db.offeringClearance.findMany({
    where: { offeringKey: `event:${id}` },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          healthProfile: { include: { selections: true } },
        },
      },
    },
  });
}
export async function reviewEventHealth(actorId: string, id: string, raw: unknown) {
  z.string().min(1).parse(id);
  return reviewOfferingHealth(actorId, `event:${id}`, raw);
}
