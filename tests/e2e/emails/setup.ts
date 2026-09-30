import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export default function setup() {
  // Vitest uses the app's React transform; Playwright's JSX transform targets component tests.
  const directory = mkdtempSync(path.join(tmpdir(), "shruti-email-previews-"));
  process.env.EMAIL_PREVIEW_DIR = directory;
  try {
    execFileSync("pnpm", ["exec", "vitest", "run", "tests/unit/shared/email-structure.test.ts"], {
      env: process.env,
      stdio: "inherit",
    });
  } catch (error) {
    rmSync(directory, { recursive: true });
    throw error;
  }
  return () => rmSync(directory, { recursive: true });
}
