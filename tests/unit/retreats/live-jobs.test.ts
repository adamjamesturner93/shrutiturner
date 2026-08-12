import { beforeEach, describe, expect, it, vi } from "vitest";

const findBookingsMock = vi.fn();
const updateBookingsMock = vi.fn();
const sendEmailMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    retreatBooking: {
      findMany: findBookingsMock,
      updateMany: updateBookingsMock,
    },
    retreatDate: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/postmark/client", () => ({
  sendPostmarkReactEmail: sendEmailMock,
}));

vi.mock("@/lib/retreats/service", () => ({ setUpRetreatOnlineRoom: vi.fn() }));
vi.mock("@/lib/retreats/live-service", () => ({ purgeExpiredRetreatChat: vi.fn() }));
vi.mock("@/lib/app-url", () => ({
  buildAbsoluteUrl: (path: string) => `https://studio.example${path}`,
}));

const { processRetreatLiveReminders } = await import("@/lib/retreats/live-jobs");

describe("retreat live reminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateBookingsMock.mockResolvedValue({ count: 1 });
    sendEmailMock.mockResolvedValue({ id: "delivery_1" });
  });

  it("claims the one-hour reminder before sending a stable website link", async () => {
    findBookingsMock.mockResolvedValue([
      {
        id: "booking_1",
        attendeeFirstName: "Asha",
        attendeeEmail: "asha@example.com",
        liveReminder24hSentAt: new Date(),
        liveReminder1hSentAt: null,
        retreatDate: {
          retreatTitleSnapshot: "Online Retreat",
          startsAt: new Date(Date.now() + 45 * 60_000),
          timezone: "Europe/London",
        },
      },
    ]);
    const result = await processRetreatLiveReminders();
    expect(result.sent1h).toBe(1);
    expect(updateBookingsMock.mock.invocationCallOrder[0]).toBeLessThan(
      sendEmailMock.mock.invocationCallOrder[0]
    );
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        textBody: expect.stringContaining(
          "https://studio.example/dashboard/retreats/booking_1/live"
        ),
      })
    );
    expect(JSON.stringify(sendEmailMock.mock.calls[0][0])).not.toContain("daily.example");
  });

  it("does not send when another worker already claimed the reminder", async () => {
    findBookingsMock.mockResolvedValue([
      {
        id: "booking_1",
        attendeeFirstName: "Asha",
        attendeeEmail: "asha@example.com",
        liveReminder24hSentAt: null,
        liveReminder1hSentAt: null,
        retreatDate: {
          retreatTitleSnapshot: "Online Retreat",
          startsAt: new Date(Date.now() + 24 * 60 * 60_000),
          timezone: "Europe/London",
        },
      },
    ]);
    updateBookingsMock.mockResolvedValue({ count: 0 });
    const result = await processRetreatLiveReminders();
    expect(result.sent24h).toBe(0);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
