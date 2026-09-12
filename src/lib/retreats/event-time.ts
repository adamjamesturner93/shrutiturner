/** Converts an admin wall-clock input without depending on the browser's timezone. */
export function eventWallTimeToIso(value: string, timezone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Enter a valid date and time.");
  const nominal = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(nominal)) throw new Error("Enter a valid date and time.");
  const format = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const wall = (time: number) => {
    const parts = Object.fromEntries(format.formatToParts(time).map(({ type, value }) => [type, value]));
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  };
  const offsets = new Set([-36, 0, 36].map((hours) => {
    const sample = nominal + hours * 3600000;
    return Date.parse(`${wall(sample)}:00Z`) - sample;
  }));
  const candidates = [...offsets].map((offset) => nominal - offset).filter((time) => wall(time) === value);
  if (!candidates.length) throw new Error(`This time does not exist in ${timezone} because the clocks change. Choose another time.`);
  if (candidates.length > 1) throw new Error(`This time occurs twice in ${timezone} because the clocks change. Choose an unambiguous time.`);
  return new Date(candidates[0]).toISOString();
}

export function eventIsoToWallTime(iso: string, timezone: string): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso)).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
