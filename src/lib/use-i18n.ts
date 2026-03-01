import { useContext, useMemo } from "react";
import { AuthContext } from "../context/auth-context";
import {
  type I18nPreferences,
  type DateFormatPreference,
  DEFAULT_PREFS,
  formatDate,
  formatDateShort,
  formatDateMedium,
  formatTime,
  formatTimeString,
  formatDateTime,
  formatDateRange,
  getTimezoneAbbr,
  getOffsetFromLondon,
} from "./date-i18n";

/**
 * Hook that returns the current user's i18n preferences and
 * bound formatting functions.
 *
 * Usage:
 * ```tsx
 * const { fmtDate, fmtTime, fmtTimeStr, fmtDateRange, prefs } = useI18n();
 * <span>{fmtDate(someIsoString)}</span>
 * <span>{fmtTime(someDate)}</span>
 * <span>{fmtTimeStr("09:00")}</span>
 * ```
 */
export function useI18n() {
  const auth = useContext(AuthContext);

  const prefs: I18nPreferences = useMemo(
    () =>
      auth?.isAuthenticated && auth.user
        ? {
            timezone: auth.user.timezone || DEFAULT_PREFS.timezone,
            dateFormat:
              (auth.user.dateFormat as DateFormatPreference) ||
              DEFAULT_PREFS.dateFormat,
          }
        : DEFAULT_PREFS,
    [auth?.isAuthenticated, auth?.user]
  );

  return useMemo(
    () => ({
      prefs,
      /** "24 February 2026" / "February 24, 2026" / "2026-02-24" */
      fmtDate: (date: Date | string, opts?: Intl.DateTimeFormatOptions) =>
        formatDate(date, prefs, opts),
      /** "24 Feb" / "Feb 24" */
      fmtDateShort: (date: Date | string, opts?: Intl.DateTimeFormatOptions) =>
        formatDateShort(date, prefs, opts),
      /** "24 Feb 2026" / "Feb 24, 2026" */
      fmtDateMedium: (date: Date | string) => formatDateMedium(date, prefs),
      /** "09:00" or "9:00 AM" from a Date */
      fmtTime: (date: Date | string) => formatTime(date, prefs),
      /** "09:00" -> "9:00 AM" if US format */
      fmtTimeStr: (timeStr: string) => formatTimeString(timeStr, prefs),
      /** "Monday 24 February 2026, 09:00" */
      fmtDateTime: (date: Date | string) => formatDateTime(date, prefs),
      /** "15–20 September 2026" */
      fmtDateRange: (start: Date | string, end: Date | string) =>
        formatDateRange(start, end, prefs),
      /** "GMT" / "EST" etc */
      tzAbbr: getTimezoneAbbr(prefs),
      /** "5 hours ahead of London" or null if same offset */
      londonOffset: getOffsetFromLondon(prefs),
    }),
    [prefs]
  );
}