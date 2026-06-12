import { beforeEach, describe, expect, it, vi } from "vitest";

const userFindUniqueMock = vi.fn();
const coachingApplicationCreateMock = vi.fn();
const sendPostmarkReactEmailMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: userFindUniqueMock,
    },
    coachingApplication: {
      create: coachingApplicationCreateMock,
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

const { submitCoachingApplication } = await import("@/lib/coaching/service");

describe("submitCoachingApplication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userFindUniqueMock.mockResolvedValue(null);
    coachingApplicationCreateMock.mockResolvedValue({
      id: "application_123",
    });
    sendPostmarkReactEmailMock.mockResolvedValue({ id: "email_123" });
  });

  it("links an anonymous application to an existing user with the same email", async () => {
    userFindUniqueMock.mockResolvedValue({ id: "user_123" });

    await submitCoachingApplication({
      userId: null,
      applicantFirstName: " Ada ",
      applicantLastName: " Lovelace ",
      applicantEmail: " ADA@example.com ",
      tier: "coached_plan",
      answers: {
        offerKey: "guided_training_plan",
        equipment: "Gym access",
      },
      isExistingCoachingClientSnapshot: false,
    });

    expect(userFindUniqueMock).toHaveBeenCalledWith({
      where: { email: "ada@example.com" },
      select: { id: true },
    });
    expect(coachingApplicationCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user_123",
          applicantFirstName: "Ada",
          applicantLastName: "Lovelace",
          applicantEmail: "ada@example.com",
        }),
      })
    );
  });

  it("does not perform an email lookup when the signed-in user id is supplied", async () => {
    await submitCoachingApplication({
      userId: "signed_in_user_123",
      applicantFirstName: "Ada",
      applicantLastName: "Lovelace",
      applicantEmail: "ada@example.com",
      tier: "coached_plan",
      answers: {
        offerKey: "guided_training_plan",
      },
      isExistingCoachingClientSnapshot: false,
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
