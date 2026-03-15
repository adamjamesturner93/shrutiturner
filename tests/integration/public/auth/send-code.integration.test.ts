import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const sendAuthCodeEmailMock = vi.fn();
const verifyTurnstileTokenMock = vi.fn();

vi.mock("@/lib/auth-code", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth-code")>("@/lib/auth-code");
  return {
    ...actual,
    generateAuthCode: vi.fn(() => "654321"),
    sendAuthCodeEmail: sendAuthCodeEmailMock,
  };
});

vi.mock("@/lib/turnstile", async () => {
  const actual = await vi.importActual<typeof import("@/lib/turnstile")>("@/lib/turnstile");
  return {
    ...actual,
    getClientIp: vi.fn(() => "127.0.0.1"),
    verifyTurnstileToken: verifyTurnstileTokenMock,
  };
});

const { db } = await import("@/lib/db");
const route = await import("@/app/api/auth/send-code/route");

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/auth/send-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeEmail(label: string) {
  return `integration-auth-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function cleanupAuthRows() {
  await db.user.deleteMany({
    where: {
      email: {
        startsWith: "integration-auth-",
      },
    },
  });
}

describe("auth send-code integration", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    verifyTurnstileTokenMock.mockResolvedValue(true);
    sendAuthCodeEmailMock.mockResolvedValue(undefined);
    await cleanupAuthRows();
  });

  afterAll(async () => {
    await cleanupAuthRows();
  });

  it("creates a new user shell when none exists", async () => {
    const email = makeEmail("new-user");

    const response = await route.POST(
      createRequest({
        email,
        turnstileToken: "token",
      })
    );

    expect(response.status).toBe(200);
    const user = await db.user.findUnique({ where: { email } });
    expect(user).toMatchObject({
      email,
      role: "student",
      authCode: "654321",
    });
    expect(sendAuthCodeEmailMock).toHaveBeenCalledWith(email, "654321", 10);
  });

  it("refreshes the auth code for an existing user without overwriting profile fields", async () => {
    const email = makeEmail("existing");
    const existing = await db.user.create({
      data: {
        email,
        firstName: "Jordan",
        lastName: "Reader",
      },
    });

    const response = await route.POST(
      createRequest({
        email,
        turnstileToken: "token",
      })
    );

    expect(response.status).toBe(200);
    const user = await db.user.findUnique({ where: { id: existing.id } });
    expect(user).toMatchObject({
      id: existing.id,
      email,
      firstName: "Jordan",
      lastName: "Reader",
      authCode: "654321",
    });
  });
});
