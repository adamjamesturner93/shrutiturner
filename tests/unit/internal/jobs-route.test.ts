import { beforeEach, describe, expect, it, vi } from "vitest";

const runScheduledJobMock = vi.fn();
const getRegisteredJobMock = vi.fn();

vi.mock("@/lib/admin/scheduled-job-service", () => ({
  runScheduledJob: runScheduledJobMock,
}));

vi.mock("@/lib/env", () => ({
  env: {
    INTERNAL_JOB_SECRET: "test-secret",
  },
}));

vi.mock("@/lib/jobs/registry", () => ({
  getRegisteredJob: getRegisteredJobMock,
}));

const route = await import("@/app/api/internal/jobs/[jobName]/route");

function createRequest(secret = "test-secret") {
  return new Request("http://localhost/api/internal/jobs/scheduler_heartbeat", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  });
}

describe("internal jobs route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects requests without the shared job secret", async () => {
    const response = await route.POST(createRequest("wrong-secret"), {
      params: Promise.resolve({ jobName: "scheduler_heartbeat" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 404 when the job is unavailable for cron execution", async () => {
    getRegisteredJobMock.mockReturnValue(null);

    const response = await route.POST(createRequest(), {
      params: Promise.resolve({ jobName: "unknown_job" }),
    });

    expect(response.status).toBe(404);
  });

  it("runs registered cron jobs through the shared runtime", async () => {
    getRegisteredJobMock.mockReturnValue({
      run: vi.fn(),
    });
    runScheduledJobMock.mockResolvedValue({
      result: {
        ok: true,
        cleanedAt: "2026-04-19T14:00:00.000Z",
      },
    });

    const response = await route.POST(createRequest(), {
      params: Promise.resolve({ jobName: "scheduler_heartbeat" }),
    });

    expect(runScheduledJobMock).toHaveBeenCalledWith({
      jobName: "scheduler_heartbeat",
      triggerType: "cron",
      run: expect.any(Function),
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      cleanedAt: "2026-04-19T14:00:00.000Z",
    });
  });
});
