import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const [target, action] = process.argv.slice(2);

if (!["staging", "prod"].includes(target || "")) {
  fail("Usage: node scripts/prisma-deploy.mjs <staging|prod> <status|deploy>");
}

if (!["status", "deploy"].includes(action || "")) {
  fail("Usage: node scripts/prisma-deploy.mjs <staging|prod> <status|deploy>");
}

const envFileName = target === "prod" ? ".env.prod" : ".env.staging";
const exampleFileName = target === "prod" ? ".env.prod.example" : ".env.staging.example";
const envFilePath = resolve(process.cwd(), envFileName);

if (!existsSync(envFilePath)) {
  fail(
    `Missing ${envFileName}. Create it from ${exampleFileName} before running remote migrations.`
  );
}

const envFromFile = parseEnvFile(envFilePath);
const databaseUrl = clean(envFromFile.DIRECT_URL) || clean(envFromFile.DATABASE_URL);

if (!databaseUrl) {
  fail(`${envFileName} must define DIRECT_URL or DATABASE_URL.`);
}

const databaseInfo = describeDatabaseUrl(databaseUrl);

if (target === "prod") {
  if (databaseInfo.hostname === "127.0.0.1" || databaseInfo.hostname === "localhost") {
    fail(".env.prod points at a local database. Refusing to run a production migration.");
  }

  if (action === "deploy" && process.env.CONFIRM_PROD_DB_DEPLOY !== "deploy-prod") {
    fail(
      "Production deploy requires explicit confirmation. Re-run with CONFIRM_PROD_DB_DEPLOY=deploy-prod."
    );
  }
}

console.log("");
console.log(`Prisma ${action} target: ${target}`);
console.log(`Env file: ${envFileName}`);
console.log(`Database host: ${databaseInfo.hostname}`);
console.log(`Database name: ${databaseInfo.databaseName}`);
console.log("");

const commandEnv = {
  ...process.env,
  ...envFromFile,
};

if (action === "status") {
  runStatus(commandEnv);
  process.exit(0);
}

runStatus(commandEnv);
run(["exec", "prisma", "migrate", "deploy"], commandEnv);

function run(args, env) {
  console.log(`> pnpm ${args.join(" ")}`);
  const result = spawnSync("pnpm", args, {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runStatus(env) {
  const args = ["exec", "prisma", "migrate", "status"];
  console.log(`> pnpm ${args.join(" ")}`);

  const result = spawnSync("pnpm", args, {
    cwd: process.cwd(),
    env,
    encoding: "utf8",
  });

  const stdout = result.stdout || "";
  const stderr = result.stderr || "";

  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);

  const hasPendingMigrationsMessage =
    /Following migrations? (?:has|have) not yet been applied:/.test(stdout);

  if (result.status === 0) {
    return;
  }

  if (result.status === 1 && hasPendingMigrationsMessage) {
    console.log("");
    console.log("Pending migrations detected. Status check completed successfully.");
    return;
  }

  process.exit(result.status ?? 1);
}

function parseEnvFile(filePath) {
  const values = {};
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1);
    values[key] = clean(rawValue) || "";
  }

  return values;
}

function clean(value) {
  if (!value) return undefined;
  return value.trim().replace(/^['"]|['"]$/g, "");
}

function describeDatabaseUrl(value) {
  try {
    const parsed = new URL(value);
    return {
      hostname: parsed.hostname || "unknown",
      databaseName: parsed.pathname.replace(/^\//, "") || "unknown",
    };
  } catch {
    fail("Could not parse database URL from env file.");
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
