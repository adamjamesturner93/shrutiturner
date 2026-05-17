import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const sendAuthCodeEmailMock = vi.fn();
const verifyTurnstileTokenMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/auth-code", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth-code")>("@/lib/auth-code");
  return {
    ...actual,
    sendAuthCodeEmail: sendAuthCodeEmailMock,
  };
});

vi.mock("@/lib/turnstile", async () => {
  const actual = await vi.importActual<typeof import("@/lib/turnstile")>("@/lib/turnstile");
  return {
    ...actual,
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
  await db.authChallenge.deleteMany({
    where: {
      email: {
        startsWith: "integration-auth-",
      },
    },
  });

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
    authMock.mockResolvedValue(null);
    verifyTurnstileTokenMock.mockResolvedValue(true);
    sendAuthCodeEmailMock.mockResolvedValue(undefined);
    await cleanupAuthRows();
  });

  afterAll(async () => {
    await cleanupAuthRows();
  });

  it("creates a login challenge for an existing user", async () => {
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

    const challenge = await db.authChallenge.findFirst({
      where: { email },
      orderBy: { sentAt: "desc" },
    });

    expect(challenge).toMatchObject({
      email,
      userId: existing.id,
      purpose: "login",
      consumedAt: null,
      attemptCount: 0,
    });

    const user = await db.user.findUnique({ where: { id: existing.id } });
    expect(user).toMatchObject({
      id: existing.id,
      email,
      firstName: "Jordan",
      lastName: "Reader",
    });

    expect(sendAuthCodeEmailMock).toHaveBeenCalledWith(email, expect.stringMatching(/^\d{6}$/), 10);
  });

  it("creates a signup challenge when no account exists for the email", async () => {
    const email = makeEmail("missing");

    const response = await route.POST(
      createRequest({
        email,
        turnstileToken: "token",
      })
    );

    expect(response.status).toBe(200);
    const challenge = await db.authChallenge.findFirst({ where: { email } });
    expect(challenge).toMatchObject({
      email,
      userId: null,
      purpose: "signup",
      consumedAt: null,
      attemptCount: 0,
      metadataJson: {
        source: "passwordless_signup",
      },
    });

    const user = await db.user.findUnique({ where: { email } });
    expect(user).toBeNull();
    expect(sendAuthCodeEmailMock).toHaveBeenCalledWith(email, expect.stringMatching(/^\d{6}$/), 10);
  });
});
