"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { dateLabel } from "@/lib/programmes/presentation";
type Week = { id: string; number: number; title: string; released: boolean; releasesAt: string };
export function WeekNavigation({
  id,
  weeks,
  selected,
  timezone,
  bottom = false,
  onNavigate,
}: {
  id: string;
  weeks: Week[];
  selected: string;
  timezone: string;
  bottom?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const index = weeks.findIndex((w) => w.id === selected);
  const current = weeks[index];
  const url = (week: Week) => `/dashboard/programmes/${id}/weeks/${week.id}`;
  // Warm route metadata only. Neither playback links nor exercise bodies are prefetched.
  useEffect(() => {
    const controller = new AbortController();
    if (!bottom)
      for (const week of [weeks[index - 1], weeks[index + 1]])
        if (week?.released) {
          router.prefetch(`/dashboard/programmes/${id}/weeks/${week.id}`);
          void fetch(`/api/me/programmes/${id}/weeks/${week.id}/preview`, {
            cache: "no-store",
            signal: controller.signal,
          }).catch(() => undefined);
        }
    return () => controller.abort();
  }, [id, index, weeks, router, bottom]);
  const neighbours = (
    <div className="flex items-start justify-between gap-4">
      {[-1, 1].map((direction) => {
        const week = weeks[index + direction];
        if (!week) return <span key={direction} />;
        return week.released ? (
          <Link
            key={direction}
            scroll={false}
            prefetch
            href={url(week)}
            className={`min-h-11 max-w-[48%] rounded-xl py-3 text-sm underline underline-offset-4 ${direction === 1 ? "text-right" : ""}`}
          >
            <span className="block font-medium">
              {direction < 0 ? "← Previous week" : "Next week →"}
            </span>
            <span className="text-muted-foreground block">
              Week {week.number}: {week.title}
            </span>
          </Link>
        ) : (
          <p key={direction} className="text-muted-foreground max-w-[48%] py-3 text-sm">
            Week {week.number} unlocks {dateLabel(week.releasesAt, timezone)}
          </p>
        );
      })}
    </div>
  );
  if (bottom)
    return (
      <nav aria-label="Previous and next week" className="border-brand-dark/10 mt-8 border-t pt-4">
        {neighbours}
      </nav>
    );
  return (
    <nav aria-label="Programme weeks" className="space-y-4">
      <div className="hidden gap-2 md:grid md:grid-cols-5">
        {weeks.map((week) =>
          week.released ? (
            <Link
              key={week.id}
              scroll={false}
              prefetch
              href={url(week)}
              aria-current={week.id === selected ? "page" : undefined}
              className={`rounded-xl p-4 text-sm ${week.id === selected ? "bg-brand-dark text-white" : "bg-secondary hover:bg-brand-dark/10"}`}
            >
              <span className="mb-2 block text-xs font-semibold">Week {week.number}</span>
              {week.title}
            </Link>
          ) : (
            <div
              key={week.id}
              aria-disabled="true"
              className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm"
            >
              <span className="mb-2 block text-xs">Week {week.number}</span>
              {week.title}
              <span className="mt-2 block text-xs">
                Opens {dateLabel(week.releasesAt, timezone)}
              </span>
            </div>
          )
        )}
      </div>
      <div className="space-y-2 md:hidden">
        <label htmlFor="programme-week-choice" className="block text-sm font-medium">
          {current ? `Week ${current.number} of ${weeks.length}` : "Choose week"}
        </label>
        <select
          id="programme-week-choice"
          value={selected}
          className="bg-background min-h-12 w-full min-w-0 rounded-xl border p-3"
          onChange={(e) => {
            const week = weeks.find((w) => w.id === e.target.value);
            if (week?.released) {
              onNavigate?.();
              router.push(url(week), { scroll: false });
            }
          }}
        >
          {weeks.map((week) => (
            <option key={week.id} value={week.id} disabled={!week.released}>
              Week {week.number} — {week.title}
              {week.released ? "" : " (not yet available)"}
            </option>
          ))}
        </select>
      </div>
    </nav>
  );
}
