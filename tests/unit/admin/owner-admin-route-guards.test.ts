import { beforeEach, describe, expect, it, vi } from "vitest";

const requireOwnerAdminUserMock = vi.fn();
const createPrivacyExportRequestMock = vi.fn();
const listBillingDisputeCasesMock = vi.fn();
const listScheduledJobRunsMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireOwnerAdminUser: requireOwnerAdminUserMock,
}));

vi.mock("@/lib/privacy/service", () => ({
  createPrivacyExportRequest: createPrivacyExportRequestMock,
}));

vi.mock("@/lib/billing/dispute-service", () => ({
  listBillingDisputeCases: listBillingDisputeCasesMock,
  updateBillingDisputeCase: vi.fn(),
}));

vi.mock("@/lib/admin/scheduled-job-service", () => ({
  listScheduledJobRuns: listScheduledJobRunsMock,
  runScheduledJob: vi.fn(),
}));

const exportRoute = await import("@/app/api/admin/members/[id]/privacy/export/route");
const disputesRoute = await import("@/app/api/admin/disputes/route");
const jobsRoute = await import("@/app/api/admin/jobs/route");

describe("owner-admin route guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOwnerAdminUserMock.mockRejectedValue(new Error("FORBIDDEN"));
  });

  it("hides privacy export tooling from non-owner-admin users", async () => {
    const response = await exportRoute.POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "member_123" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ message: "Forbidden" });
    expect(createPrivacyExportRequestMock).not.toHaveBeenCalled();
  });

  it("hides dispute tooling from non-owner-admin users", async () => {
    const response = await disputesRoute.GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ message: "Forbidden" });
    expect(listBillingDisputeCasesMock).not.toHaveBeenCalled();
  });

  it("hides scheduled-job tooling from non-owner-admin users", async () => {
    const response = await jobsRoute.GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ message: "Forbidden" });
    expect(listScheduledJobRunsMock).not.toHaveBeenCalled();
  });
});
