import { useState } from "react";
import { Badge } from "../ui/badge";
import { ChevronDown, ChevronUp, AlertTriangle, Users } from "lucide-react";
import {
  getMemberHealthSummary,
  getMemberHealthByCategory,
  MEMBER_HEALTH_PROFILES,
  aggregateHealthForClass,
} from "../../data/health-profile-data";
import type { AdminHealthProfileDto } from "@/lib/api/types";

interface HealthBadgesProps {
  memberId?: string;
  labels?: string[];
  /** Show as inline row of badges (default) or stacked list */
  layout?: "inline" | "stacked";
  /** Max badges before "+N more" */
  max?: number;
}

/** Compact inline health condition badges for attendee lists */
export function HealthBadges({ memberId, labels: labelsProp, layout = "inline", max = 4 }: HealthBadgesProps) {
  const labels = labelsProp ?? (memberId ? getMemberHealthSummary(memberId) : []);
  if (labels.length === 0) return null;

  const shown = labels.slice(0, max);
  const remaining = labels.length - max;

  if (layout === "stacked") {
    return (
      <div className="mt-1 flex flex-wrap gap-1.5">
        {labels.map((label) => (
          <Badge
            key={label}
            variant="outline"
            className="border-amber-200 bg-amber-50 text-xs text-amber-800"
          >
            {label}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {shown.map((label) => (
        <Badge
          key={label}
          variant="outline"
          className="border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] text-amber-800"
        >
          {label}
        </Badge>
      ))}
      {remaining > 0 && (
        <span className="text-muted-foreground text-[10px]">+{remaining} more</span>
      )}
    </span>
  );
}

/** Full health profile card for member detail — shows per-category breakdowns with detail text */
export function HealthProfileCard({
  memberId,
  profile,
}: {
  memberId: string;
  profile?: AdminHealthProfileDto | null;
}) {
  const legacyProfile = MEMBER_HEALTH_PROFILES[memberId];
  const legacyCategories = getMemberHealthByCategory(memberId);
  const categories = profile?.categories ?? legacyCategories;
  const additionalNotes = profile?.additionalNotes ?? legacyProfile?.additionalNotes ?? "";
  const lastUpdated = profile?.lastUpdated ?? legacyProfile?.lastUpdated ?? "";

  if (categories.length === 0) {
    return (
      <div className="bg-secondary/30 text-muted-foreground rounded-lg p-4 text-sm">
        No health conditions on file.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat.categoryId}>
          <p className="text-muted-foreground mb-1.5 text-xs">{cat.categoryTitle}</p>
          <div className="space-y-1.5">
            {cat.conditions.map((c, index) => (
              <div key={`${cat.categoryId}-${"key" in c ? c.key : c.label}-${index}`}>
                <Badge
                  variant="outline"
                  className="border-amber-200 bg-amber-50 text-xs text-amber-800"
                >
                  {c.label}
                </Badge>
                {c.detail && (
                  <p className="text-muted-foreground mt-1 ml-1 text-xs leading-relaxed">
                    {c.detail}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {additionalNotes && (
        <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
          <p className="text-muted-foreground mb-1 text-xs">Additional notes</p>
          <p className="text-sm leading-relaxed">{additionalNotes}</p>
        </div>
      )}

      {lastUpdated && (
        <p className="text-muted-foreground text-xs">
          Last updated:{" "}
          {new Date(lastUpdated).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      )}
    </div>
  );
}

/* ── Class-level aggregated health summary ── */

interface ClassHealthSummaryProps {
  attendees: Array<{
    memberId: string;
    memberName: string;
    healthConditions?: string[];
  }>;
}

/** Aggregated health prep summary for the top of admin class detail */
export function ClassHealthSummary({ attendees }: ClassHealthSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const hasExplicitConditions = attendees.some(
    (attendee) => attendee.healthConditions && attendee.healthConditions.length > 0
  );
  const { categories, membersWithProfiles, totalMembers, keyConsiderations } = hasExplicitConditions
    ? aggregateHealthFromConditions(attendees)
    : aggregateHealthForClass(attendees as { memberId: string; memberName: string }[]);

  if (membersWithProfiles === 0) {
    return null;
  }

  const totalConditions = categories.reduce((sum, cat) => sum + cat.conditions.length, 0);

  return (
    <div className="overflow-hidden rounded-lg border border-amber-200 bg-amber-50/30">
      {/* Summary header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-amber-50/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
          </div>
          <div>
            <p className="text-sm text-[#2E1F33]">Class Health Prep</p>
            <p className="text-muted-foreground text-xs">
              {membersWithProfiles} of {totalMembers} attendees have health profiles ·{" "}
              {totalConditions} condition
              {totalConditions !== 1 ? "s" : ""} across the group
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="text-muted-foreground h-4 w-4 flex-shrink-0" />
        ) : (
          <ChevronDown className="text-muted-foreground h-4 w-4 flex-shrink-0" />
        )}
      </button>

      {/* Inline condition badges — always visible as quick-glance */}
      {!expanded && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          {categories.flatMap((cat) =>
            cat.conditions.map((c) => (
              <Badge
                key={`${cat.categoryTitle}-${c.label}`}
                variant="outline"
                className="border-amber-200 bg-amber-50 text-xs text-amber-800"
              >
                {c.label}
                {c.count > 1 && <span className="ml-1 text-amber-600">×{c.count}</span>}
              </Badge>
            ))
          )}
        </div>
      )}

      {/* Expanded detail view */}
      {expanded && (
        <div className="space-y-5 border-t border-amber-200 p-4">
          {/* Per-category breakdown */}
          {categories.map((cat) => (
            <div key={cat.categoryTitle}>
              <p className="text-muted-foreground mb-2 text-xs">{cat.categoryTitle}</p>
              <div className="space-y-2">
                {cat.conditions.map((c) => (
                  <div key={c.label} className="rounded-md border border-amber-100 bg-white/60 p-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-50 text-xs text-amber-800"
                      >
                        {c.label}
                      </Badge>
                      <span className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Users className="h-3 w-3" />
                        {c.count}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1.5 text-xs">
                      {c.memberNames.join(", ")}
                    </p>
                    {c.details.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {c.details.map((d) => (
                          <p
                            key={d.memberName}
                            className="border-l-2 border-amber-200 pl-2 text-xs leading-relaxed"
                          >
                            <span className="text-[#2E1F33]">{d.memberName}:</span>{" "}
                            <span className="text-muted-foreground">{d.detail}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Key considerations (from additional notes) */}
          {keyConsiderations.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-2 text-xs">Individual Notes</p>
              <div className="space-y-2">
                {keyConsiderations.map((note, i) => {
                  const colonIdx = note.indexOf(":");
                  const name = note.slice(0, colonIdx);
                  const text = note.slice(colonIdx + 1).trim();
                  return (
                    <div key={i} className="rounded-md border border-amber-100 bg-white/60 p-3">
                      <p className="text-xs leading-relaxed">
                        <span className="text-[#2E1F33]">{name}:</span>{" "}
                        <span className="text-muted-foreground">{text}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function aggregateHealthFromConditions(
  attendees: Array<{ memberId: string; memberName: string; healthConditions?: string[] }>
) {
  const conditionMap = new Map<string, { count: number; memberNames: string[] }>();

  for (const attendee of attendees) {
    for (const label of attendee.healthConditions || []) {
      const existing = conditionMap.get(label);
      if (existing) {
        existing.count += 1;
        existing.memberNames.push(attendee.memberName);
      } else {
        conditionMap.set(label, { count: 1, memberNames: [attendee.memberName] });
      }
    }
  }

  const conditions = Array.from(conditionMap.entries())
    .map(([label, value]) => ({
      label,
      count: value.count,
      memberNames: value.memberNames,
      details: [] as { memberName: string; detail: string }[],
    }))
    .sort((a, b) => b.count - a.count);

  return {
    categories: conditions.length
      ? [{ categoryTitle: "Health Conditions", conditions }]
      : [],
    membersWithProfiles: attendees.filter((attendee) => (attendee.healthConditions?.length || 0) > 0).length,
    totalMembers: attendees.length,
    keyConsiderations: [] as string[],
  };
}
