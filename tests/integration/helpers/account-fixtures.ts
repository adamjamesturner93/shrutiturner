import { db } from "@/lib/db";

const ACCOUNT_PREFIX = "integration-account-journey-";

export function createAccountTestEmail(scope: string, label: string) {
  return `${ACCOUNT_PREFIX}${scope}-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export async function cleanupAccountRows() {
  const users = await db.user.findMany({
    where: {
      email: {
        startsWith: ACCOUNT_PREFIX,
      },
    },
    select: { id: true },
  });

  if (users.length === 0) {
    return;
  }

  const userIds = users.map((user) => user.id);

  await db.classSession.deleteMany({
    where: {
      OR: [{ instructorUserId: { in: userIds } }, { cancelledByUserId: { in: userIds } }],
    },
  });
  await db.classTimetableRule.deleteMany({
    where: {
      OR: [{ instructorUserId: { in: userIds } }, { createdByUserId: { in: userIds } }],
    },
  });
  await db.user.deleteMany({
    where: {
      id: {
        in: userIds,
      },
    },
  });
}
