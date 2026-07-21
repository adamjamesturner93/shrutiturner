import {
  ADMIN_PREFS,
  formatDate,
  formatDateMedium,
  formatDateRange,
  formatDateShort,
  formatDateTime,
  formatTime,
  formatTimeString,
  getOffsetFromLondon,
  getTimezoneAbbr,
  getTimezoneOptions,
} from "@/lib/date-i18n";
import { afterEach, describe, expect, it, vi } from "vitest";

const GB_PREFS = {
  timezone: "Europe/London",
  dateFormat: "DD/MM/YYYY" as const,
};

const US_PREFS = {
  timezone: "America/New_York",
  dateFormat: "MM/DD/YYYY" as const,
};

const ISO_PREFS = {
  timezone: "Europe/London",
  dateFormat: "YYYY-MM-DD" as const,
};

afterEach(() => {
  vi.useRealTimers();
});

describe("date-i18n", () => {
  it("formats dates using the user's timezone and preferred ordering", () => {
    expect(formatDate("2026-07-15T00:30:00.000Z", GB_PREFS)).toBe("15 July 2026");
    expect(formatDate("2026-07-15T00:30:00.000Z", US_PREFS)).toBe("July 14, 2026");
    expect(formatDate("2026-07-15T00:30:00.000Z", ISO_PREFS)).toBe("15 juli 2026");
  });

  it("formats short, medium, time and datetime values for UK and US users", () => {
    expect(formatDateShort("2026-07-15T14:30:00.000Z", GB_PREFS)).toBe("15 Jul");
    expect(formatDateMedium("2026-07-15T14:30:00.000Z", US_PREFS)).toBe("Jul 15, 2026");
    expect(formatTime("2026-07-15T14:30:00.000Z", GB_PREFS)).toBe("15:30");
    expect(formatTime("2026-07-15T14:30:00.000Z", US_PREFS)).toBe("10:30 AM");
    expect(formatDateTime("2026-07-15T14:30:00.000Z", GB_PREFS)).toContain("15:30");
    expect(formatDateTime("2026-07-15T14:30:00.000Z", US_PREFS)).toContain("10:30 AM");
  });

  it("formats plain schedule time strings in the user's preferred clock style", () => {
    expect(formatTimeString("18:30", GB_PREFS)).toBe("18:30");
    expect(formatTimeString("18:30", US_PREFS)).toBe("6:30 PM");
    expect(formatTimeString("00:05", US_PREFS)).toBe("12:05 AM");
  });

  it("formats same-month and cross-month date ranges", () => {
    expect(formatDateRange("2026-07-14T00:00:00.000Z", "2026-07-18T00:00:00.000Z", GB_PREFS)).toBe(
      "14–18 July 2026"
    );
    expect(formatDateRange("2026-07-14T00:00:00.000Z", "2026-07-18T00:00:00.000Z", US_PREFS)).toBe(
      "July 13–17, 2026"
    );
    expect(formatDateRange("2026-07-30T00:00:00.000Z", "2026-08-02T00:00:00.000Z", GB_PREFS)).toBe(
      "30 July 2026 – 2 August 2026"
    );
  });

  it("formats a single-day range as one date in the user's timezone", () => {
    expect(formatDateRange("2026-11-15T10:00:00.000Z", "2026-11-15T12:00:00.000Z", GB_PREFS)).toBe(
      "15 November 2026"
    );
    expect(formatDateRange("2026-11-16T00:30:00.000Z", "2026-11-16T02:00:00.000Z", US_PREFS)).toBe(
      "November 15, 2026"
    );
  });

  it("returns stable timezone abbreviations and London offsets", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));

    expect(getTimezoneAbbr(ADMIN_PREFS)).toBe("GMT");
    expect(getOffsetFromLondon(GB_PREFS)).toBeNull();
    expect(getOffsetFromLondon(US_PREFS)).toBe("5 hours behind London");
  });

  it("builds timezone options with offset labels sorted east to west", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));

    const options = getTimezoneOptions();
    const london = options.find((option) => option.value === "Europe/London");

    expect(london?.label).toBe("London (UTC+0)");
    expect(options[0]?.offset).toBeGreaterThanOrEqual(options[options.length - 1]?.offset ?? 0);
    expect(options.map((option) => option.value)).toContain("America/New_York");
  });
});
