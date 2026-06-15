import { beforeEach, describe, expect, it, vi } from "vitest";

const contactSubmissionCreateMock = vi.fn();
const getNotificationInboxMock = vi.fn();
const sendPostmarkReactEmailMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    contactSubmission: {
      create: contactSubmissionCreateMock,
    },
  },
}));

vi.mock("@/lib/postmark/client", () => ({
  getNotificationInbox: getNotificationInboxMock,
  sendPostmarkReactEmail: sendPostmarkReactEmailMock,
}));

const { submitContactForm } = await import("@/lib/contact/service");

describe("submitContactForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getNotificationInboxMock.mockReturnValue("support@example.com");
    contactSubmissionCreateMock.mockResolvedValue({
      id: "contact_123",
      conditions: "Variable fatigue",
      howFound: "Google",
    });
    sendPostmarkReactEmailMock.mockResolvedValue(undefined);
  });

  it("stores the enquiry and sends admin plus requester emails with consent evidence", async () => {
    await expect(
      submitContactForm({
        firstName: " Taylor ",
        lastName: " Jordan ",
        email: "Taylor@Example.com ",
        topic: "retreat",
        conditions: "Variable fatigue",
        howFound: "Google",
        message: "I want to ask whether the retreat pace would suit a fluctuating condition.",
        contactConsent: true,
        contactConsentText: "I consent to being contacted about this enquiry.",
      })
    ).resolves.toEqual({
      id: "contact_123",
      conditions: "Variable fatigue",
      howFound: "Google",
    });

    expect(contactSubmissionCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        firstName: "Taylor",
        lastName: "Jordan",
        email: "taylor@example.com",
        topic: "retreat",
        conditions: "Variable fatigue",
        howFound: "Google",
      }),
    });

    expect(sendPostmarkReactEmailMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        to: "support@example.com",
        subject: "New contact enquiry: retreat",
        tag: "contact-submission",
        replyTo: "taylor@example.com",
        metadata: expect.objectContaining({
          submissionId: "contact_123",
          contactConsent: "true",
        }),
        textBody: expect.stringContaining(
          "Consent: I consent to being contacted about this enquiry."
        ),
      })
    );
    expect(sendPostmarkReactEmailMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        to: "taylor@example.com",
        subject: "We received your enquiry",
        tag: "contact-confirmation",
        templateKey: "contact-confirmation",
        textBody: expect.stringContaining("You will usually hear back within 2 working days."),
      })
    );
  });

  it("rejects contact submissions without consent", async () => {
    await expect(
      submitContactForm({
        firstName: "Taylor",
        lastName: "Jordan",
        email: "taylor@example.com",
        topic: "retreat",
        message: "I want to ask whether the retreat pace would suit a fluctuating condition.",
        contactConsent: false,
      })
    ).rejects.toThrow("CONSENT_REQUIRED");

    expect(contactSubmissionCreateMock).not.toHaveBeenCalled();
    expect(sendPostmarkReactEmailMock).not.toHaveBeenCalled();
  });
});
