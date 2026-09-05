import { beforeEach, describe, expect, it, vi } from "vitest";

const getNotificationInboxMock = vi.fn();
const sendPostmarkReactEmailMock = vi.fn();

vi.mock("@/lib/postmark/client", () => ({
  getNotificationInbox: getNotificationInboxMock,
  sendPostmarkReactEmail: sendPostmarkReactEmailMock,
}));

const { sendRetreatOperationalEmail } = await import("@/lib/retreats/notification-service");

describe("retreat operational notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getNotificationInboxMock.mockReturnValue("shruti@shrutiturner.co.uk");
    sendPostmarkReactEmailMock.mockResolvedValue({ status: "sent" });
  });

  it("sends once to the dedicated retreat inbox instead of every login admin", async () => {
    const react = { type: "div", props: {}, key: null } as React.ReactElement;

    await sendRetreatOperationalEmail({
      subject: "New retreat booking",
      react,
      textBody: "Booking details",
      tag: "retreat-booking-admin",
    });

    expect(getNotificationInboxMock).toHaveBeenCalledOnce();
    expect(getNotificationInboxMock).toHaveBeenCalledWith(
      "RETREAT_NOTIFICATION_EMAIL",
      "shruti@shrutiturner.co.uk"
    );
    expect(sendPostmarkReactEmailMock).toHaveBeenCalledOnce();
    expect(sendPostmarkReactEmailMock).toHaveBeenCalledWith({
      to: "shruti@shrutiturner.co.uk",
      subject: "New retreat booking",
      react,
      textBody: "Booking details",
      tag: "retreat-booking-admin",
    });
  });
});
