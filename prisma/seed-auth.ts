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
    return trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
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

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const adminEmails = (process.env.ADMIN_EMAILS || "tech@thechronicyogini.com")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

async function main() {
  for (const email of adminEmails) {
    const isPrimaryInstructor = email === "tech@thechronicyogini.com";
    const firstName = isPrimaryInstructor ? "Shruti" : "Admin";
    const lastName = isPrimaryInstructor ? "Turner" : "User";
    const name = `${firstName} ${lastName}`.trim();

    await prisma.user.upsert({
      where: { email },
      update: {
        role: "admin",
        firstName,
        lastName,
        name,
      },
      create: {
        email,
        role: "admin",
        firstName,
        lastName,
        name,
      },
    });
  }

  console.log(`Seeded ${adminEmails.length} admin user(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
