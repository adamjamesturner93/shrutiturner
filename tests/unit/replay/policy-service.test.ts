import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = {
  smallGroupProgramme: {
    findUniqueOrThrow: vi.fn(),
  },
  smallGroupProgrammeSession: {
    findUniqueOrThrow: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  db: dbMock,
}));

const policyService = await import("@/lib/replay/policy-service");

describe("replay policy service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("derives replay entitlement from programme end date plus duration weeks", async () => {
    dbMock.smallGroupProgramme.findUniqueOrThrow.mockResolvedValue({
      id: "programme_123",
      startDate: new Date("2026-03-01T18:00:00.000Z"),
      endDate: new Date("2026-04-12T19:00:00.000Z"),
      durationWeeks: 6,
      sessions: [],
    });

    const policy = await policyService.resolveReplayPolicyForSmallGroupProgramme("programme_123");

    expect(policy.entitlementStartsAt.toISOString()).toBe("2026-04-12T19:00:00.000Z");
    expect(policy.entitlementEndsAt.toISOString()).toBe("2026-05-24T19:00:00.000Z");
    expect(policy.deleteAfterAt.toISOString()).toBe("2026-05-24T19:00:00.000Z");
  });

  it("falls back to session span when explicit duration is not set", async () => {
    dbMock.smallGroupProgramme.findUniqueOrThrow.mockResolvedValue({
      id: "programme_456",
      startDate: null,
      endDate: null,
      durationWeeks: null,
      sessions: [
        {
          startsAt: new Date("2026-03-02T18:00:00.000Z"),
          endsAt: new Date("2026-03-02T19:00:00.000Z"),
        },
        {
          startsAt: new Date("2026-03-30T18:00:00.000Z"),
          endsAt: new Date("2026-03-30T19:00:00.000Z"),
        },
      ],
    });

    const policy = await policyService.resolveReplayPolicyForSmallGroupProgramme("programme_456");

    expect(policy.entitlementStartsAt.toISOString()).toBe("2026-03-30T19:00:00.000Z");
    expect(policy.entitlementEndsAt.toISOString()).toBe("2026-04-27T20:00:00.000Z");
  });

  it("uses the session end for per-session replay access while keeping programme retention", async () => {
    dbMock.smallGroupProgrammeSession.findUniqueOrThrow.mockResolvedValue({
      id: "session_123",
      startsAt: new Date("2026-03-09T18:00:00.000Z"),
      endsAt: new Date("2026-03-09T19:15:00.000Z"),
      programmeId: "programme_789",
    });
    dbMock.smallGroupProgramme.findUniqueOrThrow.mockResolvedValue({
      id: "programme_789",
      startDate: new Date("2026-03-01T18:00:00.000Z"),
      endDate: new Date("2026-04-12T19:00:00.000Z"),
      durationWeeks: 4,
      sessions: [],
    });

    const policy =
      await policyService.resolveReplayPolicyForSmallGroupProgrammeSession("session_123");

    expect(policy.entitlementStartsAt.toISOString()).toBe("2026-03-09T19:15:00.000Z");
    expect(policy.entitlementEndsAt.toISOString()).toBe("2026-05-10T19:00:00.000Z");
    expect(policy.resourceType).toBe("small_group_programme_session");
  });
});
