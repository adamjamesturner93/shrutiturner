import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { programmeAccess, requireCohortStaff } from "./access";
import { programmeNow } from "./clock";
import { recordAcknowledgedAcceptances } from "@/lib/legal/acceptance-service";
import { canManageRetreatDate } from "@/lib/authz/access";
import { AcceptanceType } from "@prisma/client";

export const confirmationSchema = z.object({
  healthConfirmed: z.literal(true),
  healthRevision: z.string(),
  agreementVersion: z.string(),
  acceptances: z.array(
    z.object({
      type: z.nativeEnum(AcceptanceType),
      policyVersionId: z.string(),
      version: z.string(),
      acknowledged: z.literal(true),
    })
  ),
});
export async function confirmProgrammeHealth(userId: string, cohortId: string, raw: unknown) {
  const input = confirmationSchema.parse(raw);
  const access = await programmeAccess(userId, cohortId);
  if (!access.enrolment || input.agreementVersion !== access.cohort.agreementVersion)
    throw new Error("AGREEMENT_CHANGED");
  await recordAcknowledgedAcceptances({
    userId,
    surface: "programme_onboarding",
    acceptances: input.acceptances,
  });
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "HealthProfile" WHERE "userId" = ${userId} FOR UPDATE`;
    const profile = await tx.healthProfile.findUnique({ where: { userId } });
    if (!profile || profile.lastUpdatedAt.toISOString() !== input.healthRevision)
      throw new Error("HEALTH_REVISION_CHANGED");
    const now = programmeNow();
    await tx.healthProfile.update({
      where: { userId },
      data: { lastConfirmedAt: now, reviewRequestedAt: null },
    });
    await tx.smallGroupProgrammeEnrollment.update({
      where: { id: access.enrolment!.id },
      data: { acceptedAgreementVersion: input.agreementVersion },
    });
    return tx.offeringClearance.upsert({
      where: { userId_offeringKey: { userId, offeringKey: `programme:${access.cohort.id}` } },
      create: {
        userId,
        offeringKey: `programme:${access.cohort.id}`,
        programmeId: access.cohort.id,
        healthRevision: input.healthRevision,
        confirmedAt: now,
        status: profile.declarationStatus === "context_declared" ? "pending_review" : "ready",
      },
      update: {
        healthRevision: input.healthRevision,
        confirmedAt: now,
        status: profile.declarationStatus === "context_declared" ? "pending_review" : "ready",
        reviewerId: null,
        reviewedAt: null,
        considerations: "",
      },
    });
  });
}
const reviewSchema = z.object({
  entries: z
    .array(z.object({ id: z.string(), healthRevision: z.string() }))
    .min(1)
    .max(100),
  status: z.enum(["cleared", "cleared_with_considerations", "not_cleared"]),
  considerations: z.string().max(3000).default(""),
});
export async function reviewProgrammeHealth(actorId: string, cohortId: string, raw: unknown) {
  const cohort = await requireCohortStaff(actorId, cohortId);
  return reviewOfferingHealth(actorId, `programme:${cohort.id}`, raw);
}
export async function reviewOfferingHealth(actorId: string, offeringKey: string, raw: unknown) {
  if (offeringKey.startsWith("programme:"))
    await requireCohortStaff(actorId, offeringKey.slice(10));
  else if (
    !offeringKey.startsWith("event:") ||
    !(await canManageRetreatDate(actorId, offeringKey.slice(6)))
  )
    throw new Error("FORBIDDEN");
  const input = reviewSchema.parse(raw);
  if (input.entries.length > 1 && input.status !== "cleared")
    throw new Error("INDIVIDUAL_REVIEW_REQUIRED");
  const results: { id: string; cleared: boolean; reason?: string }[] = [];
  for (const entry of input.entries) {
    const result = await db.$transaction(async (tx) => {
      const clearance = await tx.offeringClearance.findFirst({
        where: { id: entry.id, offeringKey },
      });
      if (!clearance) return { id: entry.id, cleared: false, reason: "Not found" };
      await tx.$queryRaw`SELECT id FROM "HealthProfile" WHERE "userId" = ${clearance.userId} FOR UPDATE`;
      const current = await tx.offeringClearance.findUniqueOrThrow({ where: { id: entry.id } });
      const health = await tx.healthProfile.findUnique({ where: { userId: current.userId } });
      if (
        !health ||
        health.reviewRequestedAt ||
        health.lastUpdatedAt.toISOString() !== entry.healthRevision ||
        current.healthRevision !== entry.healthRevision ||
        !current.confirmedAt
      )
        return {
          id: entry.id,
          cleared: false,
          reason: "Health information changed; participant confirmation is required",
        };
      if (
        input.entries.length > 1 &&
        (current.status !== "ready" || health.declarationStatus === "context_declared")
      )
        return { id: entry.id, cleared: false, reason: "Individual review required" };
      await tx.offeringClearance.update({
        where: { id: entry.id },
        data: {
          status: input.status,
          reviewerId: actorId,
          reviewedAt: programmeNow(),
          considerations: input.considerations,
        },
      });
      await createAdminActionLog(
        {
          actorUserId: actorId,
          actionType: "programme_clearance_reviewed",
          targetType: "offering_clearance",
          targetId: entry.id,
          newValueJson: {
            status: input.status,
            healthRevision: entry.healthRevision,
            batch: input.entries.length > 1,
          },
        },
        tx
      );
      return { id: entry.id, cleared: true };
    });
    results.push(result);
  }
  return results;
}
