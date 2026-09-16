import "server-only";
import { db } from "@/lib/db";
import { canManageProgrammeRun } from "@/lib/authz/access";
import {
  getAcceptanceRequirementStates,
  getPhysicalServiceAcceptanceRequirements,
} from "@/lib/legal/acceptance-service";
import { programmeNow } from "./clock";
import {
  currentClearanceStatus,
  exerciseCleared,
  hasProgrammeAccess,
  isCommunityOpen,
} from "./policy";

export const cohortInclude = {
  weeks: { orderBy: { number: "asc" as const } },
  sessions: { orderBy: { startsAt: "asc" as const }, include: { replayAssets: true } },
};
export async function loadCohort(id: string) {
  const cohort = await db.smallGroupProgramme.findFirst({
    where: { cohortState: { not: null }, OR: [{ id }, { runSlug: id }] },
    include: cohortInclude,
  });
  if (!cohort) throw new Error("NOT_FOUND");
  return cohort;
}
export async function requireCohortStaff(userId: string, id: string) {
  const cohort = await loadCohort(id);
  if (!(await canManageProgrammeRun(userId, cohort.id))) throw new Error("FORBIDDEN");
  return cohort;
}
export async function healthRevision(userId: string) {
  const health = await db.healthProfile.findUnique({ where: { userId } });
  return { health, revision: health ? health.lastUpdatedAt.toISOString() : null };
}
export async function programmeAccess(
  userId: string,
  id: string,
  scope: "history" | "education" | "exercise" | "community" = "education"
) {
  const cohort = await loadCohort(id);
  const [user, enrolment, staff, health, clearance, agreements] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { emailVerified: true, deletedAt: true } }),
    db.smallGroupProgrammeEnrollment.findFirst({
      where: {
        programmeId: cohort.id,
        userId,
        status: { in: ["active", "completed", "cancelled"] },
        paidAt: { not: null },
      },
    }),
    canManageProgrammeRun(userId, cohort.id),
    healthRevision(userId),
    db.offeringClearance.findUnique({
      where: { userId_offeringKey: { userId, offeringKey: `programme:${cohort.id}` } },
    }),
    getAcceptanceRequirementStates(
      userId,
      getPhysicalServiceAcceptanceRequirements("programme_onboarding")
    ),
  ]);
  if (!user || user.deletedAt || !user.emailVerified) throw new Error("FORBIDDEN");
  if (!staff && !enrolment) throw new Error("NOT_FOUND");
  const now = programmeNow();
  const status = currentClearanceStatus(clearance, health.revision);
  const agreementsComplete =
    agreements.every((row) => row.isCurrent) &&
    enrolment?.acceptedAgreementVersion === cohort.agreementVersion;
  const accessible =
    staff || Boolean(enrolment?.status !== "cancelled" && hasProgrammeAccess(cohort, now));
  const canExercise =
    staff ||
    Boolean(
      accessible &&
      exerciseCleared(status) &&
      agreementsComplete &&
      !health.health?.reviewRequestedAt
    );
  const canCommunity = staff || Boolean(accessible && isCommunityOpen(cohort, now));
  if (scope !== "history" && !accessible) throw new Error("ACCESS_ENDED");
  if (scope === "exercise" && !canExercise) throw new Error("EXERCISE_CLEARANCE_REQUIRED");
  if (scope === "community" && !canCommunity) throw new Error("COMMUNITY_NOT_OPEN");
  return {
    cohort,
    enrolment,
    staff,
    status,
    agreementsComplete,
    agreements,
    accessible,
    canExercise,
    canCommunity,
    now,
  };
}
export async function requireReleasedWeek(
  userId: string,
  cohortId: string,
  weekId: string,
  exercise = false
) {
  const access = await programmeAccess(userId, cohortId, exercise ? "exercise" : "education");
  const week = access.cohort.weeks.find((row) => row.id === weekId);
  if (
    !week ||
    (!access.staff &&
      (!week.published || week.releasesAt > access.now || !access.cohort.confirmedAt))
  )
    throw new Error("NOT_RELEASED");
  return { ...access, week };
}
