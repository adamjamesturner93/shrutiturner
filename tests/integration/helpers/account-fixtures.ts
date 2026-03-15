import { db } from "@/lib/db";

const ACCOUNT_PREFIX = "integration-account-";

export function createAccountTestEmail(scope: string, label: string) {
  return `${ACCOUNT_PREFIX}${scope}-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export async function cleanupAccountRows() {
  await db.user.deleteMany({
    where: {
      email: {
        startsWith: ACCOUNT_PREFIX,
      },
    },
  });
}
