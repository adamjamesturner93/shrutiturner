import { beforeEach, describe, expect, it, vi } from "vitest";

const userFindUniqueMock = vi.fn();
const userUpdateMock = vi.fn();
const coachingApplicationCreateMock = vi.fn();
const coachingApplicationFindUniqueMock = vi.fn();
const coachingApplicationUpdateMock = vi.fn();
const coachingClientProfileUpsertMock = vi.fn();
const sendPostmarkReactEmailMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: userFindUniqueMock,
      update: userUpdateMock,
    },
    coachingApplication: {
      create: coachingApplicationCreateMock,
      findUnique: coachingApplicationFindUniqueMock,
      update: coachingApplicationUpdateMock,
    },
    coachingClientProfile: {
      upsert: coachingClientProfileUpsertMock,
    },
  },
}));

vi.mock("@/lib/postmark/client", () => ({
  getNotificationInbox: vi.fn(() => "shruti@example.com"),
  sendPostmarkReactEmail: sendPostmarkReactEmailMock,
}));

vi.mock("@/lib/app-url", () => ({
  buildAbsoluteUrl: vi.fn((path: string) => `https://example.com${path}`),
}));

const { submitCoachingEnquiry, updateAdminCoachingApplication } =
  await import("@/lib/coaching/service");

describe("submitCoachingEnquiry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userFindUniqueMock.mockResolvedValue(null);
    coachingApplicationCreateMock.mockResolvedValue({
      id: "application_123",
    });
    sendPostmarkReactEmailMock.mockResolvedValue({ id: "email_123" });
  });

  it("links an anonymous enquiry to an existing user with the same email", async () => {
    userFindUniqueMock.mockResolvedValue({ id: "user_123" });

    await submitCoachingEnquiry({
      userId: null,
      applicantName: " Ada Lovelace ",
      applicantEmail: " ADA@example.com ",
      answers: {
        support: "A flexible strength plan",
        context: "My capacity changes week to week",
        outcome: "Build confidence",
        referral: "Google",
      },
      consentText: "I consent to my enquiry being processed.",
    });

    expect(userFindUniqueMock).toHaveBeenCalledWith({
      where: { email: "ada@example.com" },
      select: { id: true },
    });
    expect(coachingApplicationCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user_123",
          applicantName: "Ada Lovelace",
          applicantFirstName: "Ada",
          applicantLastName: "Lovelace",
          applicantEmail: "ada@example.com",
          tier: "unsure",
          source: "public_coaching_enquire",
          enquiryConsentVersion: "coaching-enquiry.v1",
        }),
      })
    );
    expect(sendPostmarkReactEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "shruti@example.com",
        textBody: expect.stringContaining("Body context: My capacity changes week to week"),
      })
    );
  });

  it("does not perform an email lookup when the signed-in user id is supplied", async () => {
    await submitCoachingEnquiry({
      userId: "signed_in_user_123",
      applicantName: "Ada Lovelace",
      applicantEmail: "ada@example.com",
      answers: {
        support: "A flexible strength plan",
        outcome: "Build confidence",
        referral: "Google",
      },
      consentText: "I consent to my enquiry being processed.",
    });

    expect(userFindUniqueMock).not.toHaveBeenCalled();
    expect(coachingApplicationCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "signed_in_user_123",
        }),
      })
    );
  });
});

describe("updateAdminCoachingApplication", () => {
  const createExistingApplication = () => ({
    id: "application_123",
    userId: "user_123",
    status: "approved",
    tier: "coached_plan",
    recommendedOfferKey: "guided_training_plan",
    answersJson: { offerKey: "guided_training_plan" },
    applicantFirstName: "Taylor",
    applicantLastName: "Member",
    applicantEmail: "taylor@example.com",
    adminNotes: null,
    decisionReason: "We can start next week.",
    reviewedAt: new Date("2026-08-01T09:00:00.000Z"),
    approvedAt: new Date("2026-08-01T09:00:00.000Z"),
    waitlistedAt: null,
    waitlistLeftAt: null,
    convertedAt: null,
    consultationStatus: "completed",
    consultationScheduledAt: new Date("2026-08-01T09:00:00.000Z"),
    consultationCompletedAt: new Date("2026-08-01T09:30:00.000Z"),
    consultationNotes: "Discussed goals and capacity.",
    offerSentAt: new Date("2026-08-01T10:00:00.000Z"),
    user: { id: "user_123" },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    coachingApplicationFindUniqueMock.mockResolvedValue(createExistingApplication());
    coachingApplicationUpdateMock.mockResolvedValue({
      id: "application_123",
      userId: "user_123",
      status: "converted",
      tier: "coached_plan",
      adminNotes: null,
      decisionReason: "We can start next week.",
      reviewedAt: new Date("2026-08-08T09:00:00.000Z"),
      approvedAt: new Date("2026-08-01T09:00:00.000Z"),
      waitlistedAt: null,
      waitlistLeftAt: null,
      convertedAt: new Date("2026-08-08T09:00:00.000Z"),
      consultationStatus: "completed",
      consultationScheduledAt: new Date("2026-08-01T09:00:00.000Z"),
      consultationCompletedAt: new Date("2026-08-01T09:30:00.000Z"),
      consultationNotes: "Discussed goals and capacity.",
      recommendedOfferKey: "guided_training_plan",
      offerSentAt: new Date("2026-08-01T10:00:00.000Z"),
    });
    coachingClientProfileUpsertMock.mockResolvedValue({ id: "profile_123" });
    userUpdateMock.mockResolvedValue({ id: "user_123" });
    sendPostmarkReactEmailMock.mockResolvedValue({ id: "email_123" });
  });

  it("emails the client when an admin converts them without payment", async () => {
    await updateAdminCoachingApplication({
      id: "application_123",
      convertToClient: true,
    });

    expect(coachingClientProfileUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user_123" },
        create: expect.objectContaining({
          applicationId: "application_123",
          billingArrangement: "pro_bono",
          status: "onboarding",
        }),
        update: expect.objectContaining({
          applicationId: "application_123",
          billingArrangement: "pro_bono",
        }),
      })
    );
    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: "user_123" },
      data: { isCoachingClient: true },
    });
    expect(sendPostmarkReactEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "taylor@example.com",
        subject: "Your 1:1 support is confirmed",
        templateKey: "coaching-client-confirmed",
        textBody: expect.stringContaining("There is no payment step for this arrangement."),
        category: "transactional",
        userId: "user_123",
        retryable: true,
        metadata: expect.objectContaining({
          conversionMode: "admin_direct",
        }),
      })
    );
  });

  it("does not send the confirmation again for an already converted application", async () => {
    coachingApplicationFindUniqueMock.mockResolvedValueOnce({
      ...createExistingApplication(),
      status: "converted",
    });

    await updateAdminCoachingApplication({
      id: "application_123",
      convertToClient: true,
    });

    expect(sendPostmarkReactEmailMock).not.toHaveBeenCalled();
  });

  it("stores an active recommendation and derives its existing billing tier", async () => {
    coachingApplicationFindUniqueMock.mockResolvedValueOnce({
      ...createExistingApplication(),
      status: "consultation_completed",
      tier: "unsure",
      recommendedOfferKey: null,
      answersJson: {},
      approvedAt: null,
      offerSentAt: null,
    });
    coachingApplicationUpdateMock.mockResolvedValueOnce({
      ...createExistingApplication(),
      status: "offer_sent",
      tier: "personal_programme",
      recommendedOfferKey: "independent_training_plan",
    });

    await updateAdminCoachingApplication({
      id: "application_123",
      status: "offer_sent",
      recommendedOfferKey: "independent_training_plan",
    });

    expect(coachingApplicationUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "offer_sent",
          recommendedOfferKey: "independent_training_plan",
          tier: "personal_programme",
        }),
      })
    );
  });

  it("does not allow the retired accountability offer to be recommended", async () => {
    await expect(
      updateAdminCoachingApplication({
        id: "application_123",
        status: "offer_sent",
        recommendedOfferKey: "guided_accountability",
      })
    ).rejects.toThrow("RECOMMENDED_OFFER_REQUIRED");

    expect(coachingApplicationUpdateMock).not.toHaveBeenCalled();
  });
});
