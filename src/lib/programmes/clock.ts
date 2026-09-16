import "server-only";
import { readFileSync } from "node:fs";

/** Test process owns the local file. Never reads browser headers/cookies or enables a production override. */
export function programmeNow(): Date {
  const file = process.env.PROGRAMME_TEST_CLOCK_FILE;
  if (
    file &&
    process.env.NODE_ENV !== "production" &&
    !process.env.VERCEL &&
    process.env.PROGRAMME_TEST_MODE === "1"
  ) {
    const url = new URL(process.env.DATABASE_URL || "http://invalid");
    if (!["localhost", "127.0.0.1"].includes(url.hostname))
      throw new Error("TEST_CLOCK_REQUIRES_LOCAL_DATABASE");
    const now = new Date(readFileSync(file, "utf8").trim());
    if (!Number.isFinite(now.getTime())) throw new Error("INVALID_TEST_CLOCK");
    return now;
  }
  return new Date();
}
