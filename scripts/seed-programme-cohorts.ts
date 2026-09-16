import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createJanuaryDraft, seedProgrammeFixtures } from "../prisma/fixtures/programmes.ts";
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const local = ["127.0.0.1", "localhost"].includes(new URL(url).hostname);
if (!local && (!process.argv.includes("--draft-only") || process.argv.includes("--fixtures")))
  throw new Error("Remote seeding is limited to explicitly requested --draft-only");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
try {
  await createJanuaryDraft(db);
  if (process.argv.includes("--fixtures")) await seedProgrammeFixtures(db);
  console.log("Programme draft seeded");
} finally {
  await db.$disconnect();
}
