import { describe, it, expect } from "vitest";
import {
  cohortStateAt,
  hasProgrammeAccess,
  isCommunityOpen,
  currentClearanceStatus,
  exerciseCleared,
  validateExerciseEvidence,
  workoutAvailability,
  salesOpen,
  type CohortTiming,
  type TeachingSession,
} from "@/lib/programmes/policy";
import { eventWallTimeToIso } from "@/lib/retreats/event-time";
const c: CohortTiming = {
  cohortState: "on_sale",
  confirmedAt: new Date("2027-01-18T09:00Z"),
  startDate: new Date("2027-01-25T00:00Z"),
  liveCoachingEndsAt: new Date("2027-02-26T00:00Z"),
  structuredProgrammeEndsAt: new Date("2027-02-27T00:00Z"),
  followUpAccessEndsAt: new Date("2027-03-31T23:00Z"),
  communityOpenAt: new Date("2027-01-22T09:00Z"),
};
const exercise = {
  key: "squat",
  name: "Box squat",
  prescription: "3 x 8",
  instruction: "",
  alternatives: "",
  timestamp: 60,
  sessionId: "s1",
};
const session: TeachingSession = {
  id: "s1",
  startsAt: new Date("2027-01-27T18:30Z"),
  taughtAt: null,
  exerciseKeys: ["squat"],
  status: "scheduled",
  replayAssets: [],
};
describe("cohort time and independent permissions", () => {
  it.each([
    ["2027-01-17T09:00Z", "confirmed"],
    ["2027-01-25T00:00Z", "active"],
    ["2027-02-26T09:00Z", "active"],
    ["2027-02-27T00:00Z", "follow_up"],
    ["2027-03-31T22:59:59Z", "follow_up"],
    ["2027-03-31T23:00Z", "archived"],
  ])("%s is %s", (time, state) => expect(cohortStateAt(c, new Date(time))).toBe(state));
  it("unconfirmed never activates or cancels from count", () =>
    expect(cohortStateAt({ ...c, confirmedAt: null }, new Date("2027-02-01"))).toBe("on_sale"));
  it.each(["draft", "cancelled"] as const)("%s denies protected access", (state) =>
    expect(hasProgrammeAccess({ ...c, cohortState: state }, new Date("2027-02-01"))).toBe(false)
  );
  it("community timestamp is independent of purchase and teaching", () => {
    expect(isCommunityOpen(c, new Date("2027-01-22T08:59Z"))).toBe(false);
    expect(isCommunityOpen(c, new Date("2027-01-22T09:00Z"))).toBe(true);
  });
  it("sales close independently after confirmation", () => {
    const sale = { ...c, enrolmentOpen: true, enrolmentClosesAt: new Date("2027-01-24T18:00Z") };
    expect(salesOpen(sale, new Date("2027-01-24T17:59Z"))).toBe(true);
    expect(salesOpen(sale, new Date("2027-01-24T18:00Z"))).toBe(false);
  });
  it("April expiry uses London BST, not UTC midnight", () =>
    expect(eventWallTimeToIso("2027-04-01T00:00", "Europe/London")).toBe(
      "2027-03-31T23:00:00.000Z"
    ));
  it("rejects nonexistent DST wall times", () =>
    expect(() => eventWallTimeToIso("2027-03-28T01:30", "Europe/London")).toThrow());
  it.each(["pending_confirmation", "ready", "pending_review", "not_cleared"] as const)(
    "%s cannot exercise",
    (status) => expect(exerciseCleared(status)).toBe(false)
  );
  it.each(["cleared", "cleared_with_considerations"] as const)("%s can exercise", (status) =>
    expect(exerciseCleared(status)).toBe(true)
  );
  it("a superseded revision invalidates clearance", () =>
    expect(
      currentClearanceStatus(
        { status: "cleared", healthRevision: "1", confirmedAt: new Date() },
        "2"
      )
    ).toBe("pending_confirmation"));
});
describe("workout release follows cohort teaching, never individual attendance", () => {
  it("planned teaching is valid publication evidence but not availability", () => {
    expect(() =>
      validateExerciseEvidence([exercise], [session], [], session.startsAt)
    ).not.toThrow();
    expect(workoutAvailability([exercise], [session], [], new Date("2027-01-25"))).toBe(
      "awaiting_teaching"
    );
  });
  it("passing the session end does not imply actual teaching", () =>
    expect(workoutAvailability([exercise], [session], [], new Date("2027-02-01"))).toBe(
      "awaiting_teaching"
    ));
  it("actual teaching waits for an accessible recording", () =>
    expect(
      workoutAvailability(
        [exercise],
        [{ ...session, status: "completed", taughtAt: new Date("2027-01-27T19:15Z") }],
        [],
        new Date("2027-01-28")
      )
    ).toBe("preparing_recording"));
  it("unlocks cohort-wide once teaching and recording are available", () =>
    expect(
      workoutAvailability(
        [exercise],
        [
          {
            ...session,
            status: "completed",
            taughtAt: new Date("2027-01-27T19:15Z"),
            replayAssets: [
              { id: "r", status: "ready", dailyRecordingId: "daily-r", deletedAt: null },
            ],
          },
        ],
        [],
        new Date("2027-01-28")
      )
    ).toBe("available"));
  it("existing authorised demonstration permits earlier release", () =>
    expect(
      workoutAvailability(
        [{ ...exercise, demonstrationId: "demo" }],
        [session],
        [{ id: "demo", status: "ready", dailyRecordingId: "daily-demo", deletedAt: null }],
        new Date("2027-01-25")
      )
    ).toBe("available"));
  it("rejects Novel Exercise Without Demonstration", () =>
    expect(() =>
      validateExerciseEvidence(
        [{ ...exercise, key: "novel", name: "Novel Exercise Without Demonstration" }],
        [session],
        [],
        session.startsAt
      )
    ).toThrow("EXERCISE_WITHOUT_DEMONSTRATION"));
  it("future programme teaching is not prior evidence", () =>
    expect(() =>
      validateExerciseEvidence([exercise], [session], [], new Date("2027-01-20"))
    ).toThrow());
  it("deleted demos never unlock workouts", () =>
    expect(
      workoutAvailability(
        [{ ...exercise, demonstrationId: "demo" }],
        [session],
        [{ id: "demo", status: "ready", dailyRecordingId: "d", deletedAt: new Date() }],
        new Date("2027-01-25")
      )
    ).toBe("awaiting_teaching"));
});
