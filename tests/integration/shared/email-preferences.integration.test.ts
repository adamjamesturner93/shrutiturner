import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  classBookingEmailMock,
  classReminderEmailMock,
  instructorNotificationEmailMock,
  sendPostmarkReactEmailMock,
  getClassOperationalSettingsMock,
} = vi.hoisted(() => ({
  classBookingEmailMock: vi.fn(() => null),
  classReminderEmailMock: vi.fn(() => null),
  instructorNotificationEmailMock: vi.fn(() => null),
  sendPostmarkReactEmailMock: vi.fn().mockResolvedValue(undefined),
  getClassOperationalSettingsMock: vi.fn().mockResolvedValue({
    preJoinWindowMinutes: 10,
    lateJoinCutoffMinutes: 5,
    creditRefundWindowMinutes: 180,
    emptyClassAutoCancelWindowMinutes: 180,
  }),
}));

vi.mock("@/emails/class-booking", () => ({
  default: classBookingEmailMock,
}));

vi.mock("@/emails/class-reminder", () => ({
  default: classReminderEmailMock,
}));

vi.mock("@/emails/instructor-notification", () => ({
  default: instructorNotificationEmailMock,
}));

vi.mock("@/lib/postmark/client", () => ({
  sendPostmarkReactEmail: sendPostmarkReactEmailMock,
}));

vi.mock("@/lib/classes/settings-service", () => ({
  getClassOperationalSettings: getClassOperationalSettingsMock,
}));

describe("email preference formatting integration", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    getClassOperationalSettingsMock.mockResolvedValue({
      preJoinWindowMinutes: 10,
      lateJoinCutoffMinutes: 5,
      creditRefundWindowMinutes: 180,
      emptyClassAutoCancelWindowMinutes: 180,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("formats booking confirmation content using the member's saved timezone and date format", async () => {
    const { sendBookingConfirmation } = await import("@/lib/email");
    const result = await sendBookingConfirmation(
      "reader@example.com",
      "Taylor",
      "Weekend Yoga Flow",
      "",
      "",
      new Date("2026-07-15T14:30:00.000Z"),
      60,
      {
        timezone: "America/New_York",
        dateFormat: "MM/DD/YYYY",
      }
    );

    expect(result.success).toBe(true);
    expect(classBookingEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        classDate: "July 15, 2026",
        classTime: "10:30 AM",
      })
    );
    expect(sendPostmarkReactEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "reader@example.com",
        tag: "class-booking-confirmation",
        attachments: expect.arrayContaining([
          expect.objectContaining({
            name: "invite.ics",
            contentType: "text/calendar",
          }),
        ]),
      })
    );
  });

  it("formats reminder emails using 12-hour or 24-hour clock based on saved preferences", async () => {
    const { sendClassReminder } = await import("@/lib/email");
    await sendClassReminder("reader@example.com", "Taylor", "Move Well Strength", "18:30", "#", {
      timezone: "America/New_York",
      dateFormat: "MM/DD/YYYY",
    });

    expect(classReminderEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        classTime: "6:30 PM",
      })
    );
    expect(sendPostmarkReactEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tag: "class-reminder",
      })
    );
  });

  it("keeps instructor notifications on UK defaults regardless of member settings", async () => {
    const { sendInstructorNotification } = await import("@/lib/email");
    await sendInstructorNotification(
      "coach@example.com",
      "first-signup",
      "Weekend Yoga Flow",
      "2026-07-15T14:30:00.000Z",
      "18:30",
      "Taylor Reader",
      6,
      new Date("2026-07-15T17:30:00.000Z"),
      60
    );

    expect(instructorNotificationEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        classDate: "15 July 2026",
        classTime: "18:30",
      })
    );
    expect(sendPostmarkReactEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tag: "instructor-first-signup",
        attachments: expect.arrayContaining([
          expect.objectContaining({
            name: "class-invite.ics",
            contentType: "text/calendar",
          }),
        ]),
      })
    );
  });
});
