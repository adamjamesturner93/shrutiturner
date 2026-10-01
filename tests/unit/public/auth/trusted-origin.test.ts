import { beforeEach, describe, expect, it, vi } from "vitest";
const config = vi.hoisted(() => ({ NODE_ENV: "development" }));
vi.mock("@/lib/env", () => ({
  env: config,
  getBaseSiteUrlFromEnv: () => "https://shrutiturner.co.uk",
}));
vi.mock("@/lib/api/route", () => ({
  forbidden: (message: string) => new Error(message),
  tooManyRequests: vi.fn(),
}));
vi.mock("@/lib/postmark/client", () => ({
  getNotificationInbox: vi.fn(),
  sendPostmarkReactEmail: vi.fn(),
}));
vi.mock("@/lib/user-lifecycle", () => ({ recordUserLifecycleEvent: vi.fn() }));
import { enforceTrustedAuthOrigin } from "@/lib/auth-security";
const request = (origin: string) =>
  new Request("http://localhost:3000/api/auth/send-code", { method: "POST", headers: { origin } });
beforeEach(() => {
  config.NODE_ENV = "development";
});
describe("development email-auth origins", () => {
  it.each(["ngrok-free.app", "ngrok-free.dev", "ngrok.app", "ngrok.dev", "ngrok.io"])(
    "accepts rotating %s tunnels only in development",
    (domain) => {
      const req = request(`https://new-tunnel.${domain}`);
      expect(() => enforceTrustedAuthOrigin(req)).not.toThrow();
      config.NODE_ENV = "production";
      expect(() => enforceTrustedAuthOrigin(req)).toThrow("Cross-origin");
      config.NODE_ENV = "test";
      expect(() => enforceTrustedAuthOrigin(req)).toThrow("Cross-origin");
    }
  );
  it.each([
    "https://ngrok-free.app.evil.test",
    "https://evilngrok-free.app",
    "https://example.com",
    "ftp://test.ngrok-free.app",
  ])("rejects unrelated or invalid tunnel origins: %s", (origin) => {
    expect(() => enforceTrustedAuthOrigin(request(origin))).toThrow("Cross-origin");
  });
  it("accepts the reported tunnel", () => {
    expect(() =>
      enforceTrustedAuthOrigin(request("https://b8f7-90-242-239-107.ngrok-free.app"))
    ).not.toThrow();
  });
  it("preserves configured production and same-origin access", () => {
    config.NODE_ENV = "production";
    expect(() => enforceTrustedAuthOrigin(request("https://shrutiturner.co.uk"))).not.toThrow();
    expect(() => enforceTrustedAuthOrigin(request("http://localhost:3000"))).not.toThrow();
  });
  it("rejects malformed origin headers", () => {
    expect(() => enforceTrustedAuthOrigin(request("not-an-origin"))).toThrow("Invalid Origin");
  });
});
