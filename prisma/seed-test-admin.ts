import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function readEnvValue(key: "DIRECT_URL" | "DATABASE_URL"): string | undefined {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return undefined;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    if (trimmed.slice(0, idx).trim() !== key) continue;
    return trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
  }

  return undefined;
}

const connectionString =
  readEnvValue("DATABASE_URL") ||
  readEnvValue("DIRECT_URL") ||
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL or DIRECT_URL for seed script.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const email = (process.env.ADMIN_TEST_EMAIL || "admin-test@shrutiturner.local")
  .trim()
  .toLowerCase();
const authCode = (process.env.ADMIN_TEST_AUTH_CODE || "123456").trim();
const authCodeExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);

async function main() {
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: "admin",
      firstName: "Admin",
      lastName: "Test",
      name: "Admin Test",
      authCode,
      authCodeExpiry,
      emailVerified: new Date(),
    },
    create: {
      email,
      role: "admin",
      firstName: "Admin",
      lastName: "Test",
      name: "Admin Test",
      authCode,
      authCodeExpiry,
      emailVerified: new Date(),
    },
  });

  console.log(`Seeded test admin user: ${user.email}`);
  console.log(`Temporary login code: ${authCode}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
