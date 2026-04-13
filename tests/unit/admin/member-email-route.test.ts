import { beforeEach, describe, expect, it, vi } from "vitest";

const requireStaffAdminUserMock = vi.fn();
const sendAdminMemberMessageMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireStaffAdminUser: requireStaffAdminUserMock,
}));

vi.mock("@/lib/admin/member-email-service", () => ({
  sendAdminMemberMessage: sendAdminMemberMessageMock,
}));

const route = await import("@/app/api/admin/members/[id]/email/route");

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/members/member_123/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/members/[id]/email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaffAdminUserMock.mockResolvedValue({ id: "admin_123", role: "admin" });
    sendAdminMemberMessageMock.mockResolvedValue({ ok: true });
  });

  it("validates the subject and message", async () => {
    const subjectResponse = await route.POST(createRequest({ message: "Hello" }), {
      params: Promise.resolve({ id: "member_123" }),
    });
    const messageResponse = await route.POST(createRequest({ subject: "Hello" }), {
      params: Promise.resolve({ id: "member_123" }),
    });

    expect(subjectResponse.status).toBe(400);
    await expect(subjectResponse.json()).resolves.toEqual({ message: "Subject is required." });
    expect(messageResponse.status).toBe(400);
    await expect(messageResponse.json()).resolves.toEqual({ message: "Message is required." });
  });

  it("sends validated payloads through the member email service", async () => {
    const response = await route.POST(
      createRequest({ subject: "Checking in", message: "How are you getting on?" }),
      {
        params: Promise.resolve({ id: "member_123" }),
      }
    );

    expect(response.status).toBe(200);
    expect(sendAdminMemberMessageMock).toHaveBeenCalledWith({
      memberId: "member_123",
      adminUserId: "admin_123",
      subject: "Checking in",
      body: "How are you getting on?",
    });
  });
});
