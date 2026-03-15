import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

const page = await import("@/app/(app)/dashboard/health-profile/page");

describe("/dashboard/health-profile redirect page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /dashboard/health", () => {
    page.default();

    expect(redirectMock).toHaveBeenCalledWith("/dashboard/health");
  });
});
