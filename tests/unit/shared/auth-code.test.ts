import { beforeEach, describe, expect, it, vi } from "vitest";

const sendPostmarkReactEmailMock = vi.fn();

vi.mock("@/lib/postmark/client", () => ({
  sendPostmarkReactEmail: sendPostmarkReactEmailMock,
}));

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_E2E_TEST_MODE: "0",
  },
}));

const { env } = await import("@/lib/env");
const { sendAuthCodeEmail } = await import("@/lib/auth-code");

describe("sendAuthCodeEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    env.NEXT_PUBLIC_E2E_TEST_MODE = "0";
  });

  it("sends a one-shot transactional auth code email through the shared dispatcher", async () => {
    sendPostmarkReactEmailMock.mockResolvedValue(undefined);

    await sendAuthCodeEmail("reader@example.com", "123456", 10);

    expect(sendPostmarkReactEmailMock).toHaveBeenCalledWith({
      to: "reader@example.com",
      subject: "Your login code",
      react: expect.any(Object),
      textBody: "Your login code is 123456. It expires in 10 minutes.",
      tag: "auth-code",
      templateKey: "auth-code",
      category: "transactional",
      retryable: false,
      maxAttempts: 1,
      dispatchMode: "immediate_required",
    });
  });

  it("skips sending when e2e mode is enabled", async () => {
    env.NEXT_PUBLIC_E2E_TEST_MODE = "1";

    await sendAuthCodeEmail("reader@example.com", "123456", 10);

    expect(sendPostmarkReactEmailMock).not.toHaveBeenCalled();
  });
});
