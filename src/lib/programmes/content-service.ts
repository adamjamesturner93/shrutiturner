import "server-only";
import { db } from "@/lib/db";
import { programmeAccess, requireReleasedWeek } from "./access";
import {
  cohortStateAt,
  clearanceLabels,
  workoutSchema,
  workoutAvailability,
  validateExerciseEvidence,
} from "./policy";

export async function getProgrammePortal(userId: string, id: string) {
  const access = await programmeAccess(userId, id, "history");
  const { cohort, now, staff, accessible } = access;
  const weeks = cohort.weeks.map((week) => {
    const released =
      staff ||
      Boolean(accessible && cohort.confirmedAt && week.published && week.releasesAt <= now);
    return {
      id: week.id,
      number: week.number,
      title: week.title,
      releasesAt: week.releasesAt.toISOString(),
      released,
    };
  });
  const state = cohortStateAt(cohort, now);
  const credit =
    cohort.creditActive && access.enrolment?.paidAt
      ? {
          amountPence: cohort.creditAmountPence,
          endsAt: cohort.creditEndsAt?.toISOString(),
          status: access.enrolment.creditRedeemedAt
            ? "Redeemed"
            : cohort.creditEndsAt && now >= cohort.creditEndsAt
              ? "Expired"
              : cohort.creditStartsAt && now >= cohort.creditStartsAt && state !== "cancelled"
                ? "Eligible"
                : "Not yet eligible",
        }
      : null;
  return {
    id: cohort.id,
    title: cohort.title,
    state,
    staff,
    timezone: cohort.timezone,
    startsAt: cohort.startDate?.toISOString(),
    liveCoachingEndsAt: cohort.liveCoachingEndsAt?.toISOString(),
    structuredProgrammeEndsAt: cohort.structuredProgrammeEndsAt?.toISOString(),
    accessEndsAt: cohort.followUpAccessEndsAt?.toISOString(),
    communityOpenAt: cohort.communityOpenAt?.toISOString(),
    accessible,
    canExercise: access.canExercise,
    canCommunity: access.canCommunity,
    clearanceStatus: access.status,
    clearanceMessage: clearanceLabels[access.status],
    agreementsComplete: access.agreementsComplete,
    weeks,
    currentWeek: weeks.filter((week) => week.released && new Date(week.releasesAt) <= now).at(-1)
      ?.id,
    introduction: accessible ? cohort.shortDescription : "",
    equipment: accessible ? cohort.equipment : "",
    resources:
      accessible && Array.isArray(cohort.resourcesJson)
        ? cohort.resourcesJson.filter((row): row is { title: string; body: string } =>
            Boolean(
              row &&
              typeof row === "object" &&
              !Array.isArray(row) &&
              typeof row.title === "string" &&
              typeof row.body === "string"
            )
          )
        : [],
    closingBody: accessible && weeks.at(-1)?.released ? cohort.closingBody : "",
    closingVideoUrl: accessible && weeks.at(-1)?.released ? cohort.closingVideoUrl : null,
    sessions: accessible
      ? cohort.sessions.map((session) => ({
          id: session.id,
          title: session.title,
          upcoming:
            session.status === "scheduled" &&
            Boolean(session.endsAt && session.endsAt > now) &&
            ["confirmed", "active"].includes(state),
          startsAt: session.startsAt.toISOString(),
          endsAt: session.endsAt?.toISOString(),
          status: session.status,
          canJoin:
            access.canExercise &&
            ["active", "confirmed"].includes(state) &&
            session.status === "scheduled" &&
            now >= new Date(session.startsAt.getTime() - 15 * 60000) &&
            Boolean(session.endsAt && now < session.endsAt) &&
            Boolean(cohort.liveCoachingEndsAt && now < cohort.liveCoachingEndsAt),
          replayId:
            (access.canExercise &&
              session.taughtAt &&
              session.replayAssets.find(
                (asset) => asset.status === "ready" && asset.dailyRecordingId && !asset.deletedAt
              )?.id) ||
            null,
          replayState: session.replayAssets.some(
            (asset) => asset.status === "ready" && asset.dailyRecordingId
          )
            ? "ready"
            : "processing",
        }))
      : [],
    credit,
  };
}
export async function getProgrammeWeek(userId: string, cohortId: string, weekId: string) {
  const access = await requireReleasedWeek(userId, cohortId, weekId);
  const { week, cohort, now } = access;
  const workout = workoutSchema.parse(week.workoutJson || []);
  const demos = await db.replayAsset.findMany({
    where: {
      resourceType: "programme_demonstration",
      smallGroupProgrammeSessionId: null,
      id: { in: workout.flatMap((row) => (row.demonstrationId ? [row.demonstrationId] : [])) },
      smallGroupProgrammeId: cohort.id,
      deletedAt: null,
    },
  });
  const session = cohort.sessions.find((row) => row.id === week.sessionId);
  let availability: string = "not_published";
  if (week.workoutPublished) {
    try {
      validateExerciseEvidence(
        workout,
        cohort.sessions,
        demos,
        session?.startsAt || week.releasesAt
      );
      availability = workoutAvailability(workout, cohort.sessions, demos, now);
    } catch {
      availability = "awaiting_teaching";
    }
  }
  const canWorkout = access.canExercise && availability === "available";
  return {
    id: week.id,
    number: week.number,
    title: week.title,
    theme: week.theme,
    education: week.education,
    videoUrl: week.videoUrl,
    takeaways: week.takeaways,
    availability,
    canWorkout,
    clearanceMessage: clearanceLabels[access.status],
    canExercise: access.canExercise,
    workout: canWorkout
      ? workout.map((row) => ({
          ...row,
          replayId:
            row.demonstrationId ||
            cohort.sessions
              .find((session) => session.id === row.sessionId)
              ?.replayAssets.find(
                (asset) => asset.status === "ready" && asset.dailyRecordingId && !asset.deletedAt
              )?.id,
        }))
      : [],
    reflection: now >= week.reflectionAt ? week.reflection : "",
    sessionId: week.sessionId,
    live: session
      ? {
          title: session.title,
          startsAt: session.startsAt.toISOString(),
          equipment: cohort.equipment,
          replayId:
            access.canExercise && session.taughtAt && session.taughtAt <= now
              ? session.replayAssets.find(
                  (a) => a.status === "ready" && a.dailyRecordingId && !a.deletedAt
                )?.id || null
              : null,
          canJoin:
            access.canExercise &&
            session.status === "scheduled" &&
            Boolean(session.endsAt && now < session.endsAt) &&
            now >= new Date(session.startsAt.getTime() - 15 * 60000) &&
            Boolean(cohort.liveCoachingEndsAt && now < cohort.liveCoachingEndsAt),
        }
      : null,
  };
}
