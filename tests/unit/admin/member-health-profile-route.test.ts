import { beforeEach, describe, expect, it, vi } from "vitest";

const requireStaffAdminUserMock = vi.fn();
const getAdminMemberDetailMock = vi.fn();
const upsertHealthProfileMock = vi.fn();
const createAdminActionLogMock = vi.fn();
const isAcceptanceRequiredErrorMock = vi.fn();
const revalidatePathMock = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/lib/api/auth-user", () => ({
  requireStaffAdminUser: requireStaffAdminUserMock,
}));
vi.mock("@/lib/admin/members-service", () => ({
  getAdminMemberDetail: getAdminMemberDetailMock,
}));
vi.mock("@/lib/health/health-service", () => ({
  upsertHealthProfile: upsertHealthProfileMock,
}));
vi.mock("@/lib/admin/action-log-service", () => ({
  createAdminActionLog: createAdminActionLogMock,
}));
vi.mock("@/lib/legal/acceptance-service", () => ({
  isAcceptanceRequiredError: isAcceptanceRequiredErrorMock,
}));

const route = await import("@/app/api/admin/members/[id]/health-profile/route");

const member = {
  id: "member_123",
  healthProfile: {
    declarationStatus: "context_declared",
    conditions: { asthma: true },
    details: {},
    additionalNotes: "",
  },
};

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/members/member_123/health-profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PUT /api/admin/members/[id]/health-profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaffAdminUserMock.mockResolvedValue({ id: "admin_123", role: "owner_admin" });
    getAdminMemberDetailMock.mockResolvedValue(member);
    upsertHealthProfileMock.mockResolvedValue({});
    createAdminActionLogMock.mockResolvedValue({});
    isAcceptanceRequiredErrorMock.mockReturnValue(false);
  });

  it("records the admin source and requests member review", async () => {
    const response = await route.PUT(
      request({
        source: "consultation",
        declarationStatus: "context_declared",
        conditions: { asthma: true },
        details: {},
        additionalNotes: "",
        tracksFlareCheckIns: false,
      }),
      { params: Promise.resolve({ id: "member_123" }) }
    );

    expect(response.status).toBe(200);
    expect(upsertHealthProfileMock).toHaveBeenCalledWith(
      "member_123",
      expect.objectContaining({ conditions: { asthma: true } }),
      "admin_123",
      expect.objectContaining({ actor: "admin", source: "consultation" })
    );
    expect(createAdminActionLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "member_health_profile_updated",
        targetId: "member_123",
      })
    );
  });

  it("returns a privacy-safe conflict when health-data consent is absent", async () => {
    const acceptanceError = { details: { requiredAcceptances: [{ type: "health_data" }] } };
    upsertHealthProfileMock.mockRejectedValue(acceptanceError);
    isAcceptanceRequiredErrorMock.mockImplementation((error) => error === acceptanceError);

    const response = await route.PUT(
      request({ source: "coaching_enquiry", declarationStatus: "none_declared" }),
      { params: Promise.resolve({ id: "member_123" }) }
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        message: expect.stringContaining("Health Data Consent"),
      })
    );
  });
});
