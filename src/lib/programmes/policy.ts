import { z } from "zod";
import type { CohortState, ExerciseClearanceStatus } from "@prisma/client";

export type CohortTiming = {
  cohortState: CohortState | null;
  confirmedAt: Date | null;
  startDate: Date | null;
  liveCoachingEndsAt: Date | null;
  structuredProgrammeEndsAt: Date | null;
  followUpAccessEndsAt: Date | null;
  communityOpenAt: Date | null;
};

export function cohortStateAt(cohort: CohortTiming, now: Date): CohortState {
  if (!cohort.cohortState || cohort.cohortState === "draft") return "draft";
  if (cohort.cohortState === "cancelled" || cohort.cohortState === "archived")
    return cohort.cohortState;
  if (cohort.followUpAccessEndsAt && now >= cohort.followUpAccessEndsAt) return "archived";
  if (!cohort.confirmedAt) return "on_sale";
  if (cohort.structuredProgrammeEndsAt && now >= cohort.structuredProgrammeEndsAt)
    return "follow_up";
  if (cohort.startDate && now >= cohort.startDate) return "active";
  return "confirmed";
}

export function hasProgrammeAccess(cohort: CohortTiming, now: Date) {
  return !["draft", "cancelled", "archived"].includes(cohortStateAt(cohort, now));
}
export function isCommunityOpen(cohort: CohortTiming, now: Date) {
  return (
    hasProgrammeAccess(cohort, now) &&
    Boolean(cohort.communityOpenAt && now >= cohort.communityOpenAt)
  );
}
export function currentClearanceStatus(
  clearance: {
    status: ExerciseClearanceStatus;
    healthRevision: string | null;
    confirmedAt: Date | null;
  } | null,
  revision: string | null
): ExerciseClearanceStatus {
  if (!clearance?.confirmedAt || !revision || clearance.healthRevision !== revision)
    return "pending_confirmation";
  return clearance.status;
}
export function exerciseCleared(status: ExerciseClearanceStatus) {
  return status === "cleared" || status === "cleared_with_considerations";
}
export const clearanceLabels: Record<ExerciseClearanceStatus, string> = {
  pending_confirmation: "Complete your health check before training.",
  ready: "Your health information is waiting for clearance.",
  pending_review: "Your health information is waiting for review.",
  cleared: "Cleared for exercise",
  cleared_with_considerations: "Cleared for exercise with considerations",
  not_cleared: "You are not currently cleared for exercise. Please contact your coach.",
};
export const workoutSchema = z
  .array(
    z.object({
      key: z.string().min(1).max(100),
      name: z.string().min(1).max(150),
      prescription: z.string().min(1).max(200),
      instruction: z.string().max(1000).default(""),
      alternatives: z.string().max(1000).default(""),
      sessionId: z.string().optional(),
      demonstrationId: z.string().optional(),
      timestamp: z.number().int().min(0).max(86400).default(0),
    })
  )
  .max(30);
export type WorkoutExercise = z.infer<typeof workoutSchema>[number];
export type TeachingSession = {
  id: string;
  startsAt: Date;
  taughtAt: Date | null;
  exerciseKeys: string[];
  status: string;
  replayAssets: {
    id: string;
    status: string;
    dailyRecordingId: string | null;
    deletedAt: Date | null;
  }[];
};
export type Demonstration = {
  id: string;
  status: string;
  dailyRecordingId: string | null;
  deletedAt: Date | null;
};

export function validateExerciseEvidence(
  workout: WorkoutExercise[],
  sessions: TeachingSession[],
  demonstrations: Demonstration[],
  currentSessionAt: Date
) {
  for (const exercise of workout) {
    const session = sessions.find(
      (row) =>
        row.id === exercise.sessionId &&
        row.startsAt <= currentSessionAt &&
        row.exerciseKeys.includes(exercise.key)
    );
    const demo = demonstrations.find(
      (row) =>
        row.id === exercise.demonstrationId &&
        !row.deletedAt &&
        row.status === "ready" &&
        row.dailyRecordingId
    );
    if (!session && !demo) throw new Error(`EXERCISE_WITHOUT_DEMONSTRATION:${exercise.name}`);
  }
}

/** Cohort/content-level evidence. Intentionally has no participant attendance argument. */
export function workoutAvailability(
  workout: WorkoutExercise[],
  sessions: TeachingSession[],
  demonstrations: Demonstration[],
  now: Date
) {
  let processing = false;
  for (const exercise of workout) {
    if (
      demonstrations.some(
        (row) =>
          row.id === exercise.demonstrationId &&
          row.status === "ready" &&
          row.dailyRecordingId &&
          !row.deletedAt
      )
    )
      continue;
    const session = sessions.find(
      (row) => row.id === exercise.sessionId && row.exerciseKeys.includes(exercise.key)
    );
    if (!session?.taughtAt || session.taughtAt > now || session.status !== "completed")
      return "awaiting_teaching" as const;
    if (
      !session.replayAssets.some(
        (row) => row.status === "ready" && row.dailyRecordingId && !row.deletedAt
      )
    )
      processing = true;
  }
  return processing ? ("preparing_recording" as const) : ("available" as const);
}

export function salesOpen(
  cohort: CohortTiming & { enrolmentOpen: boolean; enrolmentClosesAt: Date | null },
  now: Date
) {
  return (
    ["on_sale", "confirmed"].includes(cohortStateAt(cohort, now)) &&
    cohort.enrolmentOpen &&
    Boolean(
      cohort.startDate &&
      now < cohort.startDate &&
      cohort.enrolmentClosesAt &&
      now < cohort.enrolmentClosesAt
    )
  );
}
export const followUpMessage =
  "Your five coached weeks are complete. Everything from the programme remains available here until 31 March. You can continue using the workouts, recordings and community during this time, but there are no further live sessions or new weekly workouts.";
