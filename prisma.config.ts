import { defineConfig } from "prisma/config";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function cleanEnvUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.replace(/^['"]|['"]$/g, "");
}

function readFromDotEnvFile(key: "DIRECT_URL" | "DATABASE_URL"): string | undefined {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return undefined;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    const currentKey = trimmed.slice(0, idx).trim();
    if (currentKey !== key) continue;
    const rawValue = trimmed.slice(idx + 1);
    return cleanEnvUrl(rawValue);
  }
  return undefined;
}

const prismaUrl =
  readFromDotEnvFile("DIRECT_URL") ||
  readFromDotEnvFile("DATABASE_URL") ||
  cleanEnvUrl(process.env.DIRECT_URL) ||
  cleanEnvUrl(process.env.DATABASE_URL);

if (!prismaUrl) {
  throw new Error("Missing DIRECT_URL or DATABASE_URL in environment.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --experimental-strip-types --experimental-specifier-resolution=node prisma/seed.ts",
  },
  datasource: {
    // Prefer direct connection for CLI/migrations, fallback to runtime URL.
    url: prismaUrl,
  },
});
