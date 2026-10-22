import { formatRetreatDate } from "@/lib/retreats/presentation";

/** Split editor-authored level-two headings without interpreting headings inside code fences. */
export function splitScheduleSections(markdown: string) {
  const sections: { title: string; body: string }[] = [];
  const introduction: string[] = [];
  let current: { title: string; body: string } | undefined;
  let fence = "";
  for (const line of markdown.split(/\r?\n/)) {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = "";
    }
    const heading = !fence && line.match(/^##\s+(.+?)\s*#*\s*$/);
    if (heading) {
      current = { title: heading[1], body: "" };
      sections.push(current);
    } else if (current) current.body += `${line}\n`;
    else introduction.push(line);
  }
  // Older event records use one "Friday: ..." line per day rather than Markdown headings.
  // Only convert when every non-empty line has a weekday prefix, preserving arbitrary prose.
  if (!sections.length) {
    const lines = markdown.split(/\r?\n/).filter((line) => line.trim());
    const days = lines.map((line) =>
      line.match(/^\s*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*(.+)$/i)
    );
    if (days.length > 1 && days.every(Boolean)) {
      return { introduction: "", sections: days.map((day) => ({ title: day![1], body: day![2] })) };
    }
  }
  return { introduction: introduction.join("\n").trim(), sections };
}

/** Add calendar days in the event timezone, so DST changes cannot shift a day label. */
export function getScheduleDateLabel(
  startDate: string | undefined,
  dayIndex: number,
  timezone = "Europe/London"
) {
  if (!startDate) return "";
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: timezone,
  }).formatToParts(start);
  const part = (type: string) => Number(parts.find((value) => value.type === type)?.value);
  const day = new Date(Date.UTC(part("year"), part("month") - 1, part("day") + dayIndex, 12));
  return formatRetreatDate(day, "UTC", true);
}

/** Avoid repeating a weekday already shown in the full date label. */
export function getScheduleDisplayTitle(title: string, dateLabel?: string) {
  if (!dateLabel) return title;
  return title.replace(
    /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*[-–—]\s*(?=\S)/i,
    ""
  );
}
