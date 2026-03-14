/**
 * Internationalised date/time formatting utilities.
 *
 * All member-facing dates and times should go through these helpers
 * so they respect the user's saved timezone and dateFormat preferences.
 *
 * Admin pages use the UK defaults (see ADMIN_PREFS).
 */

export type DateFormatPreference = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

export interface I18nPreferences {
  timezone: string;
  dateFormat: DateFormatPreference;
}

/** Default preferences for unauthenticated users and admin views */
export const DEFAULT_PREFS: I18nPreferences = {
  timezone: "Europe/London",
  dateFormat: "DD/MM/YYYY",
};

/** Admin views always use UK formatting */
export const ADMIN_PREFS: I18nPreferences = DEFAULT_PREFS;

/* ──────────── Locale mapping ──────────── */

function getLocale(dateFormat: DateFormatPreference): string {
  switch (dateFormat) {
    case "MM/DD/YYYY":
      return "en-US";
    case "YYYY-MM-DD":
      return "sv-SE"; // ISO-style date ordering
    default:
      return "en-GB";
  }
}

function isHour12Format(dateFormat: DateFormatPreference): boolean {
  return dateFormat === "MM/DD/YYYY";
}

/* ──────────── Core formatters ──────────── */

/**
 * Format a Date or ISO string as a date.
 *
 * Default style: "24 February 2026" (en-GB) / "February 24, 2026" (en-US) / "2026-02-24" (sv-SE)
 */
export function formatDate(
  date: Date | string,
  prefs: I18nPreferences,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const locale = getLocale(prefs.dateFormat);
  const defaultOpts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: prefs.timezone,
  };
  return d.toLocaleDateString(locale, { ...defaultOpts, ...options });
}

/**
 * Format a Date or ISO string as a short date.
 *
 * e.g. "24 Feb" / "Feb 24" / "02-24"
 */
export function formatDateShort(
  date: Date | string,
  prefs: I18nPreferences,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const locale = getLocale(prefs.dateFormat);
  const defaultOpts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    timeZone: prefs.timezone,
  };
  return d.toLocaleDateString(locale, { ...defaultOpts, ...options });
}

/**
 * Format a Date or ISO string as a date with short month and year.
 *
 * e.g. "24 Feb 2026" / "Feb 24, 2026"
 */
export function formatDateMedium(date: Date | string, prefs: I18nPreferences): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const locale = getLocale(prefs.dateFormat);
  return d.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: prefs.timezone,
  });
}

/**
 * Format a Date or ISO string as a time.
 *
 * e.g. "09:00" (24hr) or "9:00 AM" (12hr)
 */
export function formatTime(date: Date | string, prefs: I18nPreferences): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const locale = getLocale(prefs.dateFormat);
  return d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: isHour12Format(prefs.dateFormat),
    timeZone: prefs.timezone,
  });
}

/**
 * Format a "HH:MM" time string into the user's preferred format.
 *
 * This is for schedule display where times are stored as plain strings
 * (e.g. "09:00", "18:30") rather than full Date objects.
 * The time is assumed to be in Europe/London already.
 */
export function formatTimeString(timeStr: string, prefs: I18nPreferences): string {
  if (isHour12Format(prefs.dateFormat)) {
    const [h, m] = timeStr.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
  }
  return timeStr;
}

/**
 * Format a date + time together.
 *
 * e.g. "Monday 24 February 2026, 09:00" or "Monday, February 24, 2026, 9:00 AM"
 */
export function formatDateTime(date: Date | string, prefs: I18nPreferences): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const locale = getLocale(prefs.dateFormat);
  return d.toLocaleString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: isHour12Format(prefs.dateFormat),
    timeZone: prefs.timezone,
  });
}

/**
 * Format a date range: "15–20 September 2026" or "September 15–20, 2026"
 */
export function formatDateRange(
  start: Date | string,
  end: Date | string,
  prefs: I18nPreferences
): string {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;

  // If same month/year, compact format
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    const locale = getLocale(prefs.dateFormat);
    const month = s.toLocaleDateString(locale, {
      month: "long",
      timeZone: prefs.timezone,
    });
    const year = s.toLocaleDateString(locale, {
      year: "numeric",
      timeZone: prefs.timezone,
    });
    const startDay = s.toLocaleDateString(locale, {
      day: "numeric",
      timeZone: prefs.timezone,
    });
    const endDay = e.toLocaleDateString(locale, {
      day: "numeric",
      timeZone: prefs.timezone,
    });

    if (prefs.dateFormat === "MM/DD/YYYY") {
      return `${month} ${startDay}–${endDay}, ${year}`;
    }
    return `${startDay}–${endDay} ${month} ${year}`;
  }

  // Different months — just format both fully
  return `${formatDate(s, prefs)} – ${formatDate(e, prefs)}`;
}

/**
 * Get the user's timezone abbreviation.
 *
 * e.g. "GMT", "BST", "EST", "PST"
 */
export function getTimezoneAbbr(prefs: I18nPreferences): string {
  const d = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: prefs.timezone,
    timeZoneName: "short",
  }).formatToParts(d);
  return parts.find((p) => p.type === "timeZoneName")?.value || "";
}

/**
 * Get the user's UTC offset relative to London, expressed as a human-readable string.
 *
 * Returns null if the user is already in the same offset as London.
 * Otherwise returns e.g. "5 hours ahead of London" or "3 hours behind London".
 */
export function getOffsetFromLondon(prefs: I18nPreferences): string | null {
  if (prefs.timezone === "Europe/London") return null;

  const now = new Date();

  const getOffsetMinutes = (tz: string) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || "0", 10);
    const tzDate = new Date(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
    const utcDate = new Date(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes()
    );
    return Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
  };

  const userOffset = getOffsetMinutes(prefs.timezone);
  const londonOffset = getOffsetMinutes("Europe/London");
  const diffMinutes = userOffset - londonOffset;

  if (diffMinutes === 0) return null;

  const absHours = Math.floor(Math.abs(diffMinutes) / 60);
  const absMinutes = Math.abs(diffMinutes) % 60;
  const direction = diffMinutes > 0 ? "ahead of" : "behind";
  const hourLabel = absHours === 1 ? "hour" : "hours";

  if (absMinutes === 0) {
    return `${absHours} ${hourLabel} ${direction} London`;
  }
  return `${absHours}h ${absMinutes}m ${direction} London`;
}

/* ──────────── Timezone list with offsets ──────────── */

interface TimezoneOption {
  value: string;
  label: string;
  offset: number; // in minutes, for sorting
}

/**
 * Compute the current UTC offset for a given IANA timezone.
 * Returns offset in minutes (e.g. London in winter = 0, Paris = 60, New York = -300).
 */
function getUtcOffsetMinutes(tz: string): number {
  const now = new Date();
  // Get a formatted date in the target timezone
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || "0", 10);

  const tzDate = new Date(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  const utcDate = new Date(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes()
  );
  return Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
}

function formatOffsetLabel(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  if (minutes === 0) {
    return `UTC${sign}${hours}`;
  }
  return `UTC${sign}${hours}:${String(minutes).padStart(2, "0")}`;
}

const TIMEZONE_DEFINITIONS: { value: string; city: string }[] = [
  { value: "Pacific/Auckland", city: "Auckland" },
  { value: "Australia/Sydney", city: "Sydney" },
  { value: "Australia/Perth", city: "Perth" },
  { value: "Asia/Tokyo", city: "Tokyo" },
  { value: "Asia/Singapore", city: "Singapore" },
  { value: "Asia/Kolkata", city: "India" },
  { value: "Asia/Dubai", city: "Dubai" },
  { value: "Africa/Nairobi", city: "Nairobi" },
  { value: "Europe/Helsinki", city: "Helsinki, Athens" },
  { value: "Europe/Paris", city: "Paris, Berlin, Rome" },
  { value: "Africa/Lagos", city: "Lagos" },
  { value: "Europe/London", city: "London" },
  { value: "Europe/Dublin", city: "Dublin" },
  { value: "Atlantic/Reykjavik", city: "Reykjavik" },
  { value: "America/Sao_Paulo", city: "São Paulo" },
  { value: "America/New_York", city: "New York" },
  { value: "America/Toronto", city: "Toronto" },
  { value: "America/Chicago", city: "Chicago" },
  { value: "America/Denver", city: "Denver" },
  { value: "America/Los_Angeles", city: "Los Angeles" },
  { value: "America/Vancouver", city: "Vancouver" },
  { value: "America/Anchorage", city: "Anchorage" },
  { value: "Pacific/Honolulu", city: "Honolulu" },
  { value: "Africa/Johannesburg", city: "Johannesburg" },
];

/**
 * Returns timezone options sorted by UTC offset (east to west),
 * with current offset shown in the label.
 *
 * Labels look like: "London (UTC+0)" or "New York (UTC-5)"
 *
 * Call this at render time — offsets change with DST.
 */
export function getTimezoneOptions(): TimezoneOption[] {
  return TIMEZONE_DEFINITIONS.map((tz) => {
    const offset = getUtcOffsetMinutes(tz.value);
    return {
      value: tz.value,
      label: `${tz.city} (${formatOffsetLabel(offset)})`,
      offset,
    };
  }).sort((a, b) => b.offset - a.offset); // East to west
}
