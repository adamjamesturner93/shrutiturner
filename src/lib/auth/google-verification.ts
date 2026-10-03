import "server-only";
import { db } from "@/lib/db";

/** Auth.js supplies this profile after validating Google's OIDC response. */
export async function recordGoogleEmailVerification(input: {
  userId?: string;
  email?: string | null;
  provider?: string;
  profile?: { email?: unknown; email_verified?: unknown };
}) {
  if (
    input.provider !== "google" ||
    !input.userId ||
    !input.email ||
    input.profile?.email_verified !== true ||
    typeof input.profile.email !== "string" ||
    input.profile.email.trim().toLowerCase() !== input.email.trim().toLowerCase()
  )
    return;
  await db.user.updateMany({
    where: {
      id: input.userId,
      email: { equals: input.email, mode: "insensitive" },
      emailVerified: null,
      deletedAt: null,
    },
    data: { emailVerified: new Date() },
  });
}
