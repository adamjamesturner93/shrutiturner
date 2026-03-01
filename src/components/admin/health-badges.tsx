import { useState } from "react";
import { Badge } from "../ui/badge";
import { ChevronDown, ChevronUp, AlertTriangle, Users } from "lucide-react";
import {
  getMemberHealthSummary,
  getMemberHealthByCategory,
  MEMBER_HEALTH_PROFILES,
  aggregateHealthForClass,
} from "../../data/health-profile-data";

interface HealthBadgesProps {
  memberId: string;
  /** Show as inline row of badges (default) or stacked list */
  layout?: "inline" | "stacked";
  /** Max badges before "+N more" */
  max?: number;
}

/** Compact inline health condition badges for attendee lists */
export function HealthBadges({
  memberId,
  layout = "inline",
  max = 4,
}: HealthBadgesProps) {
  const labels = getMemberHealthSummary(memberId);
  if (labels.length === 0) return null;

  const shown = labels.slice(0, max);
  const remaining = labels.length - max;

  if (layout === "stacked") {
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {labels.map((label) => (
          <Badge
            key={label}
            variant="outline"
            className="text-xs bg-amber-50 border-amber-200 text-amber-800"
          >
            {label}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      {shown.map((label) => (
        <Badge
          key={label}
          variant="outline"
          className="text-[10px] py-0 px-1.5 bg-amber-50 border-amber-200 text-amber-800"
        >
          {label}
        </Badge>
      ))}
      {remaining > 0 && (
        <span className="text-[10px] text-muted-foreground">
          +{remaining} more
        </span>
      )}
    </span>
  );
}

/** Full health profile card for member detail — shows per-category breakdowns with detail text */
export function HealthProfileCard({ memberId }: { memberId: string }) {
  const profile = MEMBER_HEALTH_PROFILES[memberId];
  const categories = getMemberHealthByCategory(memberId);

  if (!profile || categories.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-secondary/30 text-sm text-muted-foreground">
        No health conditions on file.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat.categoryId}>
          <p className="text-xs text-muted-foreground mb-1.5">
            {cat.categoryTitle}
          </p>
          <div className="space-y-1.5">
            {cat.conditions.map((c) => (
              <div key={c.label}>
                <Badge
                  variant="outline"
                  className="text-xs bg-amber-50 border-amber-200 text-amber-800"
                >
                  {c.label}
                </Badge>
                {c.detail && (
                  <p className="text-xs text-muted-foreground mt-1 ml-1 leading-relaxed">
                    {c.detail}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {profile.additionalNotes && (
        <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100">
          <p className="text-xs text-muted-foreground mb-1">
            Additional notes
          </p>
          <p className="text-sm leading-relaxed">{profile.additionalNotes}</p>
        </div>
      )}

      {profile.lastUpdated && (
        <p className="text-xs text-muted-foreground">
          Last updated:{" "}
          {new Date(profile.lastUpdated).toLocaleDateString("en-GB", {
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
  attendees: { memberId: string; memberName: string }[];
}

/** Aggregated health prep summary for the top of admin class detail */
export function ClassHealthSummary({ attendees }: ClassHealthSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const { categories, membersWithProfiles, totalMembers, keyConsiderations } =
    aggregateHealthForClass(attendees);

  if (membersWithProfiles === 0) {
    return null;
  }

  const totalConditions = categories.reduce(
    (sum, cat) => sum + cat.conditions.length,
    0
  );

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/30 overflow-hidden">
      {/* Summary header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-amber-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <p className="text-sm text-[#2E1F33]">
              Class Health Prep
            </p>
            <p className="text-xs text-muted-foreground">
              {membersWithProfiles} of {totalMembers} attendees have health
              profiles · {totalConditions} condition
              {totalConditions !== 1 ? "s" : ""} across the group
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {/* Inline condition badges — always visible as quick-glance */}
      {!expanded && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {categories.flatMap((cat) =>
            cat.conditions.map((c) => (
              <Badge
                key={`${cat.categoryTitle}-${c.label}`}
                variant="outline"
                className="text-xs bg-amber-50 border-amber-200 text-amber-800"
              >
                {c.label}
                {c.count > 1 && (
                  <span className="ml-1 text-amber-600">×{c.count}</span>
                )}
              </Badge>
            ))
          )}
        </div>
      )}

      {/* Expanded detail view */}
      {expanded && (
        <div className="border-t border-amber-200 p-4 space-y-5">
          {/* Per-category breakdown */}
          {categories.map((cat) => (
            <div key={cat.categoryTitle}>
              <p className="text-xs text-muted-foreground mb-2">
                {cat.categoryTitle}
              </p>
              <div className="space-y-2">
                {cat.conditions.map((c) => (
                  <div
                    key={c.label}
                    className="rounded-md bg-white/60 border border-amber-100 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="text-xs bg-amber-50 border-amber-200 text-amber-800"
                      >
                        {c.label}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {c.count}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {c.memberNames.join(", ")}
                    </p>
                    {c.details.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {c.details.map((d) => (
                          <p
                            key={d.memberName}
                            className="text-xs leading-relaxed pl-2 border-l-2 border-amber-200"
                          >
                            <span className="text-[#2E1F33]">
                              {d.memberName}:
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {d.detail}
                            </span>
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
              <p className="text-xs text-muted-foreground mb-2">
                Individual Notes
              </p>
              <div className="space-y-2">
                {keyConsiderations.map((note, i) => {
                  const colonIdx = note.indexOf(":");
                  const name = note.slice(0, colonIdx);
                  const text = note.slice(colonIdx + 1).trim();
                  return (
                    <div
                      key={i}
                      className="rounded-md bg-white/60 border border-amber-100 p-3"
                    >
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
