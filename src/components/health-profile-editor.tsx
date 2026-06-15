import { useState } from "react";
import {
  Activity,
  HeartPulse,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
} from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  HEALTH_CATEGORIES,
  type HealthProfile,
  type HealthCategory,
} from "../data/health-profile-data";

const CATEGORY_ICONS: Record<string, typeof Activity> = {
  body: Activity,
  "heart-pulse": HeartPulse,
  brain: Brain,
  sparkles: Sparkles,
};

interface HealthProfileEditorProps {
  profile: HealthProfile;
  onSave: (profile: HealthProfile, consentAccepted: boolean) => void | Promise<void>;
  /** Compact mode for onboarding — hides notes, uses smaller spacing */
  compact?: boolean;
  /** Show a "Skip" button */
  onSkip?: () => void;
  requireConsentAcknowledgement?: boolean;
  initialConsentAccepted?: boolean;
}

export function HealthProfileEditor({
  profile,
  onSave,
  compact = false,
  onSkip,
  requireConsentAcknowledgement = true,
  initialConsentAccepted = false,
}: HealthProfileEditorProps) {
  const [conditions, setConditions] = useState<Record<string, boolean>>(() => ({
    ...profile.conditions,
  }));
  const [details, setDetails] = useState<Record<string, string>>(() => ({ ...profile.details }));
  const [additionalNotes, setAdditionalNotes] = useState(profile.additionalNotes);
  const [tracksFlareCheckIns, setTracksFlareCheckIns] = useState(
    Boolean(profile.tracksFlareCheckIns)
  );
  const [nothingToDeclare, setNothingToDeclare] = useState(
    profile.declarationStatus === "none_declared"
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    // Auto-expand categories that have selections
    const expanded = new Set<string>();
    for (const cat of HEALTH_CATEGORIES) {
      if (cat.items.some((item) => conditions[item.key])) {
        expanded.add(cat.id);
      }
    }
    // Always expand first category if nothing selected
    if (expanded.size === 0) expanded.add("pain_injury");
    return expanded;
  });
  const [saved, setSaved] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(initialConsentAccepted);
  const selectedCount = Object.keys(conditions).filter((k) => conditions[k]).length;
  const hasAdditionalNotes = additionalNotes.trim().length > 0;
  const hasContext = selectedCount > 0 || hasAdditionalNotes;
  const declarationStatus = nothingToDeclare
    ? "none_declared"
    : hasContext
      ? "context_declared"
      : "incomplete";
  const nothingToDeclareDisabled = hasContext || tracksFlareCheckIns;

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCondition = (key: string) => {
    setConditions((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
        // Clear details when unchecking
        setDetails((d) => {
          const nd = { ...d };
          delete nd[key];
          return nd;
        });
      } else {
        next[key] = true;
      }
      return next;
    });
    setNothingToDeclare(false);
    setSaved(false);
  };

  const updateDetails = (key: string, value: string) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
    setNothingToDeclare(false);
    setSaved(false);
  };

  const handleSave = async () => {
    await onSave(
      {
        declarationStatus,
        conditions,
        details,
        tracksFlareCheckIns,
        additionalNotes,
        lastConfirmedAt: profile.lastConfirmedAt,
        lastUpdated: new Date().toISOString().split("T")[0],
      },
      consentAccepted
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      {/* Privacy note */}
      <div className="border-brand-accent/10 bg-brand-accent/5 flex items-start gap-3 rounded-lg border p-3">
        <Info className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
        <div className="text-muted-foreground text-xs leading-relaxed">
          <p>
            This information is only visible to Shruti and is used to tailor sessions for your body.
            You can update or remove anything at any time. Individual details are never sold or
            shared for marketing; anonymised grouped patterns may be used for research, education or
            public posts.
          </p>
        </div>
      </div>

      {requireConsentAcknowledgement ? (
        <label className="bg-secondary/20 flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm">
          <input
            type="checkbox"
            checked={consentAccepted}
            onChange={(event) => setConsentAccepted(event.target.checked)}
            className="accent-brand-accent mt-0.5 h-4 w-4"
          />
          <span className="text-muted-foreground leading-relaxed">
            I agree to Shruti Turner using the health information I provide to assess suitability,
            tailor training, deliver sessions safely and understand anonymised grouped patterns for
            research, education or public posts.
          </span>
        </label>
      ) : null}

      {/* Categories */}
      {HEALTH_CATEGORIES.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          conditions={conditions}
          details={details}
          expanded={expandedCategories.has(category.id)}
          onToggleExpand={() => toggleCategory(category.id)}
          onToggleCondition={toggleCondition}
          onUpdateDetails={updateDetails}
          compact={compact}
        />
      ))}

      {/* Additional notes */}
      {!compact && (
        <div className="space-y-2">
          <label className="text-muted-foreground text-sm">Anything else Shruti should know?</label>
          <Textarea
            value={additionalNotes}
            onChange={(e) => {
              setAdditionalNotes(e.target.value);
              if (e.target.value.trim()) {
                setNothingToDeclare(false);
              }
              setSaved(false);
            }}
            placeholder="e.g. I have morning stiffness for ~30 mins, I prefer not to bear weight on my wrists, my energy varies day to day..."
            rows={3}
            className="text-sm"
          />
        </div>
      )}

      {(hasContext || tracksFlareCheckIns) && !nothingToDeclare ? (
        <label className="bg-secondary/20 flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm">
          <input
            type="checkbox"
            checked={tracksFlareCheckIns}
            onChange={(event) => {
              setTracksFlareCheckIns(event.target.checked);
              setSaved(false);
            }}
            className="accent-brand-accent mt-0.5 h-4 w-4"
          />
          <span className="text-muted-foreground leading-relaxed">
            My symptoms can flare or change day to day and may affect class.
          </span>
        </label>
      ) : null}

      <label
        className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${
          nothingToDeclareDisabled
            ? "bg-secondary/10 text-muted-foreground cursor-not-allowed opacity-70"
            : "bg-secondary/20 cursor-pointer"
        }`}
      >
        <input
          type="checkbox"
          checked={nothingToDeclare}
          disabled={nothingToDeclareDisabled}
          onChange={(event) => {
            const checked = event.target.checked;
            setNothingToDeclare(checked);
            if (checked) {
              setConditions({});
              setDetails({});
              setAdditionalNotes("");
              setTracksFlareCheckIns(false);
            }
            setSaved(false);
          }}
          className="accent-brand-accent mt-0.5 h-4 w-4"
        />
        <span className="leading-relaxed">Nothing relevant to share right now.</span>
      </label>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-muted-foreground text-xs">
          {declarationStatus === "none_declared"
            ? "No current health context recorded"
            : selectedCount === 0
              ? "No conditions selected yet"
              : `${selectedCount} condition${selectedCount !== 1 ? "s" : ""} selected`}
        </p>
        <div className="flex items-center gap-3">
          {onSkip && (
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Skip for now
            </Button>
          )}
          <Button
            onClick={() => void handleSave()}
            size="sm"
            className="bg-brand-accent hover:bg-brand-accent/90"
            disabled={
              (requireConsentAcknowledgement && !consentAccepted) ||
              declarationStatus === "incomplete"
            }
          >
            {saved ? (
              <>
                <Check className="mr-1 h-4 w-4" />
                Saved
              </>
            ) : compact ? (
              "Continue"
            ) : (
              "Save Health Profile"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Category section ── */

function CategorySection({
  category,
  conditions,
  details,
  expanded,
  onToggleExpand,
  onToggleCondition,
  onUpdateDetails,
  compact,
}: {
  category: HealthCategory;
  conditions: Record<string, boolean>;
  details: Record<string, string>;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleCondition: (key: string) => void;
  onUpdateDetails: (key: string, value: string) => void;
  compact: boolean;
}) {
  const Icon = CATEGORY_ICONS[category.icon] || Activity;
  const activeCount = category.items.filter((item) => conditions[item.key]).length;

  return (
    <div className="overflow-hidden rounded-lg border">
      {/* Category header */}
      <button
        onClick={onToggleExpand}
        className="hover:bg-secondary/30 flex w-full items-center justify-between p-4 text-left transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-brand-accent/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
            <Icon className="text-brand-accent h-4 w-4" />
          </div>
          <div>
            <p className="text-sm">{category.title}</p>
            {activeCount > 0 && <p className="text-brand-accent text-xs">{activeCount} selected</p>}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="text-muted-foreground h-4 w-4" />
        ) : (
          <ChevronDown className="text-muted-foreground h-4 w-4" />
        )}
      </button>

      {/* Category items */}
      {expanded && (
        <div className="space-y-1 border-t px-4 py-3">
          {!compact && <p className="text-muted-foreground mb-3 text-xs">{category.description}</p>}
          <div className="grid grid-cols-2 gap-x-1 gap-y-0">
            {category.items.map((item) => (
              <div
                key={item.key}
                className={item.hasDetails && conditions[item.key] ? "col-span-2" : ""}
              >
                <label className="hover:bg-secondary/30 flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition-colors">
                  <input
                    type="checkbox"
                    checked={!!conditions[item.key]}
                    onChange={() => onToggleCondition(item.key)}
                    className="accent-brand-accent h-4 w-4 flex-shrink-0 rounded"
                  />
                  <span className="text-sm">{item.label}</span>
                </label>

                {/* Details input when checked + hasDetails */}
                {item.hasDetails && conditions[item.key] && (
                  <div className="mb-2 ml-9">
                    <input
                      type="text"
                      value={details[item.key] || ""}
                      onChange={(e) => onUpdateDetails(item.key, e.target.value)}
                      placeholder={item.detailsPlaceholder}
                      className="bg-input-background placeholder:text-muted-foreground/50 focus:border-brand-accent w-full rounded-md border px-3 py-1.5 text-sm transition-colors outline-none"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
