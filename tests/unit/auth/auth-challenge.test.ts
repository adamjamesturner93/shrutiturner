import { afterEach, describe, expect, it, vi } from "vitest";

describe("generateAuthCode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses the documented fixed code only in explicit E2E mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_E2E_TEST_MODE", "1");
    const { generateAuthCode } = await import("@/lib/auth-challenge");

    expect(generateAuthCode()).toBe("123456");
  });

  it("generates a six-digit code outside E2E mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_E2E_TEST_MODE", "0");
    const { generateAuthCode } = await import("@/lib/auth-challenge");

    expect(generateAuthCode()).toMatch(/^\d{6}$/);
  });
});
