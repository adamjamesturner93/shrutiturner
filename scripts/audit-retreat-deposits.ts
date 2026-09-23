import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  calculateDepositFromRule,
  resolveRetreatDepositRule,
} from "../src/lib/retreats/pricing.ts";

// Read-only: compare legacy room display snapshots with the authoritative event rule.
// Supply the intended DATABASE_URL explicitly; no environment is loaded implicitly.
if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL for the database to audit.");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
try {
  const dates = await db.retreatDate.findMany({
    include: {
      depositRules: { where: { active: true } },
      roomOptions: { where: { active: true }, include: { ratePlans: { where: { active: true } } } },
    },
  });
  const findings: Array<Record<string, string | number | null>> = [];
  for (const date of dates) {
    if (date.depositRules.length !== 1) {
      findings.push({
        event: date.retreatTitleSnapshot,
        dateId: date.id,
        issue: `Expected one active payment rule; found ${date.depositRules.length}`,
      });
      continue;
    }
    for (const room of date.roomOptions) {
      const rule = resolveRetreatDepositRule(date.depositRules[0], {
        normalPricePence: room.pricePence,
        depositPence: room.depositAmountPence,
      });
      const expected = calculateDepositFromRule(room.pricePence, rule);
      if (room.depositAmountPence !== expected)
        findings.push({
          event: date.retreatTitleSnapshot,
          dateId: date.id,
          room: room.label,
          storedPence: room.depositAmountPence,
          expectedPence: expected,
        });
    }
  }
  console.log(JSON.stringify({ readOnly: true, checkedEvents: dates.length, findings }, null, 2));
} finally {
  await db.$disconnect();
}
