import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("daily room creation", () => {
  const originalEnv = {
    DAILY_API_KEY: process.env.DAILY_API_KEY,
    DAILY_API_BASE: process.env.DAILY_API_BASE,
  };

  beforeEach(() => {
    process.env.DAILY_API_KEY = "daily_test_key";
    process.env.DAILY_API_BASE = "https://daily.example/v1";
  });

  afterEach(() => {
    process.env.DAILY_API_KEY = originalEnv.DAILY_API_KEY;
    process.env.DAILY_API_BASE = originalEnv.DAILY_API_BASE;
    vi.unstubAllGlobals();
  });

  it("opens the room 24 hours before class start", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        name: "class-session_123",
        url: "https://daily.example/session_123",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { createSessionRoom } = await import("@/lib/daily/service");
    const startsAtUtc = new Date("2026-03-23T18:30:00.000Z");
    const endsAtUtc = new Date("2026-03-23T19:15:00.000Z");

    await createSessionRoom("session_123", startsAtUtc, endsAtUtc);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [, requestInit] = fetchMock.mock.calls[0] as [
      string,
      { body?: string; headers?: Record<string, string> },
    ];
    const body = JSON.parse(requestInit.body || "{}") as {
      properties?: { nbf?: number; exp?: number };
    };

    expect(body.properties?.nbf).toBe(Math.floor(startsAtUtc.getTime() / 1000) - 24 * 60 * 60);
    expect(body.properties?.exp).toBe(Math.floor(endsAtUtc.getTime() / 1000) + 2 * 60 * 60);
  });
});
