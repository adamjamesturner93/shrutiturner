import { toUtcFromLocalDateTime } from "@/lib/classes/session-service";
import { describe, expect, it } from "vitest";

describe("toUtcFromLocalDateTime", () => {
  it("keeps winter London class times on UTC", () => {
    expect(toUtcFromLocalDateTime("2026-01-15", "18:30", "Europe/London").toISOString()).toBe(
      "2026-01-15T18:30:00.000Z"
    );
  });

  it("converts summer London class times from BST to UTC", () => {
    expect(toUtcFromLocalDateTime("2026-07-15", "18:30", "Europe/London").toISOString()).toBe(
      "2026-07-15T17:30:00.000Z"
    );
  });

  it("handles DST-aware conversion for non-UK user timezones too", () => {
    expect(toUtcFromLocalDateTime("2026-07-15", "09:00", "America/New_York").toISOString()).toBe(
      "2026-07-15T13:00:00.000Z"
    );
  });

  it("converts spring DST-start dates using the post-change London offset", () => {
    expect(toUtcFromLocalDateTime("2026-03-29", "09:00", "Europe/London").toISOString()).toBe(
      "2026-03-29T08:00:00.000Z"
    );
  });
});
