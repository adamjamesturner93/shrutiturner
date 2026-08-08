import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendPostmarkReactEmailMock, getClassOperationalSettingsMock } = vi.hoisted(() => ({
  sendPostmarkReactEmailMock: vi.fn(),
  getClassOperationalSettingsMock: vi.fn(),
}));

vi.mock("@/lib/postmark/client", () => ({
  sendPostmarkReactEmail: sendPostmarkReactEmailMock,
}));

vi.mock("@/lib/classes/settings-service", () => ({
  getClassOperationalSettings: getClassOperationalSettingsMock,
}));

vi.mock("@/lib/env", () => ({
  env: {
    NODE_ENV: "test",
  },
  getDatabaseUrl: () => "postgresql://postgres:postgres@127.0.0.1:5432/test",
  getBaseSiteUrlFromEnv: () => "https://shrutiturner.co.uk",
}));

const {
  sendBookingConfirmation,
  sendClassCancellation,
  sendClassReminder,
  sendClassUnbooking,
  sendInstructorNotification,
  sendWaitlistJoinedEmail,
  sendWaitlistPromotedEmail,
} = await import("@/lib/email");

describe("class lifecycle emails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendPostmarkReactEmailMock.mockResolvedValue({ success: true });
    getClassOperationalSettingsMock.mockResolvedValue({
      creditRefundWindowMinutes: 180,
      preJoinWindowMinutes: 10,
      lateJoinCutoffMinutes: 5,
      emptyClassAutoCancelWindowMinutes: 180,
    });
  });

  it("uses retryable transactional Postmark delivery with class metadata and support contact", async () => {
    const startsAt = new Date("2026-03-24T12:30:00.000Z");
    const userPrefs = {
      timezone: "Europe/London",
      dateFormat: "DD/MM/YYYY" as const,
    };

    await sendBookingConfirmation(
      "member@example.com",
      "Ava",
      "Lifecycle Strength",
      "2026-03-24",
      "12:30",
      startsAt,
      45,
      userPrefs
    );
    await sendWaitlistJoinedEmail(
      "member@example.com",
      "Ava",
      "Lifecycle Strength",
      "2026-03-24",
      "12:30",
      startsAt,
      45,
      1,
      userPrefs
    );
    await sendWaitlistPromotedEmail(
      "member@example.com",
      "Ava",
      "Lifecycle Strength",
      "2026-03-24",
      "12:30",
      startsAt,
      45,
      userPrefs
    );
    await sendClassReminder(
      "member@example.com",
      "Ava",
      "Lifecycle Strength",
      "12:30",
      "https://shrutiturner.co.uk/dashboard/classes/lifecycle-strength/join?sessionId=session_123",
      userPrefs,
      {
        preJoinWindowMinutes: 10,
        lateJoinCutoffMinutes: 5,
      }
    );
    await sendInstructorNotification(
      "instructor@example.com",
      "no-attendance-cancelled",
      "Lifecycle Strength",
      startsAt.toISOString(),
      startsAt.toISOString(),
      "No attendees",
      0,
      startsAt,
      45
    );
    await sendClassCancellation(
      "member@example.com",
      "Ava",
      "Lifecycle Strength",
      "2026-03-24",
      "12:30",
      true,
      userPrefs,
      startsAt,
      45
    );
    await sendClassUnbooking(
      "member@example.com",
      "Ava",
      "Lifecycle Strength",
      "2026-03-24",
      "12:30",
      startsAt,
      45,
      userPrefs
    );

    expect(sendPostmarkReactEmailMock).toHaveBeenCalledTimes(7);
    const calls = sendPostmarkReactEmailMock.mock.calls.map(([input]) => input);

    expect(calls.map((input) => input.tag)).toEqual([
      "class-booking-confirmation",
      "class-waitlist-joined",
      "class-waitlist-promoted",
      "class-reminder",
      "instructor-no-attendance-cancelled",
      "class-cancellation",
      "class-unbooking",
    ]);

    for (const input of calls) {
      expect(input).toEqual(
        expect.objectContaining({
          category: "transactional",
          dispatchMode: "immediate_best_effort",
          retryable: true,
          metadata: expect.objectContaining({
            className: "Lifecycle Strength",
            emailType: input.templateKey,
          }),
        })
      );
      expect(input.textBody).toContain("Need help? Contact Shruti:");
      expect(input.textBody).toContain("https://shrutiturner.co.uk/contact");
    }

    expect(calls[0].metadata).toEqual(
      expect.objectContaining({
        classStartsAtUtc: startsAt.toISOString(),
      })
    );
    expect(calls[3].textBody).toContain("First-time joins close 5 minutes after the start time.");
  });
});
