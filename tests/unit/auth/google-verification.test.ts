import { beforeEach, expect, it, vi } from "vitest";
const { updateMany } = vi.hoisted(() => ({ updateMany: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { user: { updateMany } } }));
import { recordGoogleEmailVerification } from "@/lib/auth/google-verification";
beforeEach(() => vi.clearAllMocks());
it("records Google verification only on the matching persisted account", async () => {
  await recordGoogleEmailVerification({
    userId: "user",
    email: "cat@example.com",
    provider: "google",
    profile: { email: "Cat@example.com", email_verified: true },
  });
  expect(updateMany).toHaveBeenCalledWith({
    where: {
      id: "user",
      email: { equals: "cat@example.com", mode: "insensitive" },
      emailVerified: null,
      deletedAt: null,
    },
    data: { emailVerified: expect.any(Date) },
  });
});
it.each([
  { email: "cat@example.com", email_verified: false },
  { email: "cat@example.com", email_verified: "true" },
  { email: "other@example.com", email_verified: true },
  undefined,
])("does not infer verification from signing in or an untrusted claim", async (profile) => {
  await recordGoogleEmailVerification({
    userId: "user",
    email: "cat@example.com",
    provider: "google",
    profile,
  });
  expect(updateMany).not.toHaveBeenCalled();
});
it("does not trust a different provider", async () => {
  await recordGoogleEmailVerification({
    userId: "user",
    email: "cat@example.com",
    provider: "other",
    profile: { email: "cat@example.com", email_verified: true },
  });
  expect(updateMany).not.toHaveBeenCalled();
});
