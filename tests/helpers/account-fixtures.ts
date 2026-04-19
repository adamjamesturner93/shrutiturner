import { db } from "./db";
import { sanitizeSegment, uniqueToken } from "./_shared";

const ACCOUNT_EMAIL_PREFIX = "account-fixture+";

export function createAccountTestEmail(scope: string, role: string) {
  const normalizedScope = sanitizeSegment(scope) || "scope";
  const normalizedRole = sanitizeSegment(role) || "member";
  return `${ACCOUNT_EMAIL_PREFIX}${normalizedScope}-${uniqueToken(normalizedRole)}@example.com`;
}

export async function cleanupAccountRows() {
  await db.user.deleteMany({
    where: {
      email: {
        startsWith: ACCOUNT_EMAIL_PREFIX,
      },
    },
  });
}
