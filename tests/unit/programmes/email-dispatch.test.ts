import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  cohorts: vi.fn(),
  messages: vi.fn(),
  user: vi.fn(),
  delivery: vi.fn(),
  update: vi.fn(),
  send: vi.fn(),
  allowed: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    smallGroupProgramme: { findMany: mocks.cohorts },
    programmeMessage: { findMany: mocks.messages, update: mocks.update },
    user: { findUnique: mocks.user },
    emailDelivery: { upsert: mocks.delivery },
  },
}));
vi.mock("@/lib/programmes/clock", () => ({ programmeNow: () => new Date("2027-01-10T12:00Z") }));
vi.mock("@/lib/programmes/policy", () => ({ cohortStateAt: () => "pre_start" }));
vi.mock("@/lib/programmes/content-service", () => ({ getProgrammePortal: vi.fn() }));
vi.mock("@/lib/programmes/message-guard", () => ({ programmeMessageMaySend: mocks.allowed }));
vi.mock("@/lib/postmark/client", () => ({
  attemptEmailDelivery: mocks.send,
  getPostmarkMessageStream: () => "test",
  getNotificationInbox: () => "coach@example.test",
}));
import { dispatchProgrammeMessages } from "@/lib/programmes/jobs";

beforeEach(() => {
  mocks.allowed.mockResolvedValue(true);
  mocks.send.mockResolvedValue({});
  mocks.user.mockResolvedValue({ email: "participant@example.test" });
  mocks.cohorts.mockResolvedValue([
    {
      id: "cohort",
      title: "Rebuilding <Your> Strength",
      timezone: "Europe/London",
      startDate: new Date("2027-01-25T00:00Z"),
      updatedAt: new Date("2027-01-01T00:00Z"),
      weeks: [],
      sessions: [],
      minimumParticipants: 6,
      enrollments: [
        { userId: "participant", status: "active", purchaserEmail: "purchaser@example.test" },
      ],
    },
  ]);
});

describe("programme email delivery", () => {
  it.each(["welcome", "confirmation", "refunded"])(
    "renders branded %s messages without changing delivery ownership",
    async (kind) => {
      mocks.messages.mockResolvedValue([
        {
          id: "message",
          programmeId: "cohort",
          userId: kind === "confirmation" ? null : "participant",
          kind,
          sourceKey: kind,
        },
      ]);
      await dispatchProgrammeMessages();
      const { create, update, where } = mocks.delivery.mock.calls[0][0];
      expect(where.id).toBe("programme-message");
      expect(update).toEqual({});
      expect(create.toEmail).toBe(
        kind === "refunded"
          ? "purchaser@example.test"
          : kind === "confirmation"
            ? "coach@example.test"
            : "participant@example.test"
      );
      expect(create.payloadJson.htmlBody).toContain("logo-white-horizontal-email.png");
      expect(create.payloadJson.htmlBody).toContain("Rebuilding &lt;Your&gt; Strength");
      expect(create.payloadJson.textBody.toLowerCase()).toContain("rebuilding <your> strength");
      expect(create.subject).not.toMatch(/: (welcome|confirmation|refunded)$/);
      expect(create.payloadJson.htmlBody.includes("/onboarding")).toBe(kind === "welcome");
      expect(mocks.send).toHaveBeenCalledWith("programme-message");
    }
  );
  it("preserves suppression without sending", async () => {
    mocks.allowed.mockResolvedValue(false);
    mocks.messages.mockResolvedValue([
      { id: "message", programmeId: "cohort", userId: "participant", kind: "welcome" },
    ]);
    await dispatchProgrammeMessages();
    expect(mocks.delivery).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
