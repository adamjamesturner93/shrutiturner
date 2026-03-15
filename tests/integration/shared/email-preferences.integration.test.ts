import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  renderMock,
  classBookingEmailMock,
  classReminderEmailMock,
  instructorNotificationEmailMock,
} = vi.hoisted(() => ({
  renderMock: vi.fn().mockResolvedValue("<html />"),
  classBookingEmailMock: vi.fn(() => null),
  classReminderEmailMock: vi.fn(() => null),
  instructorNotificationEmailMock: vi.fn(() => null),
}));

vi.mock("@react-email/render", () => ({
  render: renderMock,
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

import {
  sendBookingConfirmation,
  sendClassReminder,
  sendInstructorNotification,
} from "@/lib/email";

describe("email preference formatting integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("formats booking confirmation content using the member's saved timezone and date format", async () => {
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
    expect(renderMock).toHaveBeenCalledTimes(1);
  });

  it("formats reminder emails using 12-hour or 24-hour clock based on saved preferences", async () => {
    await sendClassReminder("reader@example.com", "Taylor", "Move Well Strength", "18:30", "#", {
      timezone: "America/New_York",
      dateFormat: "MM/DD/YYYY",
    });

    expect(classReminderEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        classTime: "6:30 PM",
      })
    );
  });

  it("keeps instructor notifications on UK defaults regardless of member settings", async () => {
    await sendInstructorNotification(
      "coach@example.com",
      "first-signup",
      "Weekend Yoga Flow",
      "2026-07-15T14:30:00.000Z",
      "18:30",
      "Taylor Reader",
      6
    );

    expect(instructorNotificationEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        classDate: "15 July 2026",
        classTime: "18:30",
      })
    );
  });
});
