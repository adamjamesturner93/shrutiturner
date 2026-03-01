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
  onSave: (profile: HealthProfile) => void;
  /** Compact mode for onboarding — hides notes, uses smaller spacing */
  compact?: boolean;
  /** Show a "Skip" button */
  onSkip?: () => void;
}

export function HealthProfileEditor({
  profile,
  onSave,
  compact = false,
  onSkip,
}: HealthProfileEditorProps) {
  const [conditions, setConditions] = useState<Record<string, boolean>>(
    () => ({ ...profile.conditions })
  );
  const [details, setDetails] = useState<Record<string, string>>(
    () => ({ ...profile.details })
  );
  const [additionalNotes, setAdditionalNotes] = useState(
    profile.additionalNotes
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => {
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
    }
  );
  const [saved, setSaved] = useState(false);

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
    setSaved(false);
  };

  const updateDetails = (key: string, value: string) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    onSave({
      conditions,
      details,
      additionalNotes,
      lastUpdated: new Date().toISOString().split("T")[0],
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const selectedCount = Object.keys(conditions).filter(
    (k) => conditions[k]
  ).length;

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      {/* Privacy note */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#4B5B32]/5 border border-[#4B5B32]/10">
        <Info className="w-4 h-4 text-[#4B5B32] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <p>
            This information is only visible to Shruti and is used to adapt
            sessions for your body. You can update or remove anything at any
            time. Nothing here is shared, sold, or used for any purpose other
            than your training.
          </p>
        </div>
      </div>

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
          <label className="text-sm text-muted-foreground">
            Anything else Shruti should know?
          </label>
          <Textarea
            value={additionalNotes}
            onChange={(e) => {
              setAdditionalNotes(e.target.value);
              setSaved(false);
            }}
            placeholder="e.g. I have morning stiffness for ~30 mins, I prefer not to bear weight on my wrists, my energy varies day to day..."
            rows={3}
            className="text-sm"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          {selectedCount === 0
            ? "No conditions selected"
            : `${selectedCount} condition${selectedCount !== 1 ? "s" : ""} selected`}
        </p>
        <div className="flex items-center gap-3">
          {onSkip && (
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Skip for now
            </Button>
          )}
          <Button
            onClick={handleSave}
            size="sm"
            className="bg-[#4B5B32] hover:bg-[#4B5B32]/90"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 mr-1" />
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
  const activeCount = category.items.filter(
    (item) => conditions[item.key]
  ).length;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Category header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#4B5B32]/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-[#4B5B32]" />
          </div>
          <div>
            <p className="text-sm">{category.title}</p>
            {activeCount > 0 && (
              <p className="text-xs text-[#4B5B32]">
                {activeCount} selected
              </p>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Category items */}
      {expanded && (
        <div className="border-t px-4 py-3 space-y-1">
          {!compact && (
            <p className="text-xs text-muted-foreground mb-3">
              {category.description}
            </p>
          )}
          <div className="grid grid-cols-2 gap-x-1 gap-y-0">
            {category.items.map((item) => (
              <div
                key={item.key}
                className={
                  item.hasDetails && conditions[item.key]
                    ? "col-span-2"
                    : ""
                }
              >
                <label className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-secondary/30 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!conditions[item.key]}
                    onChange={() => onToggleCondition(item.key)}
                    className="accent-[#4B5B32] w-4 h-4 rounded flex-shrink-0"
                  />
                  <span className="text-sm">{item.label}</span>
                </label>

                {/* Details input when checked + hasDetails */}
                {item.hasDetails && conditions[item.key] && (
                  <div className="ml-9 mb-2">
                    <input
                      type="text"
                      value={details[item.key] || ""}
                      onChange={(e) => onUpdateDetails(item.key, e.target.value)}
                      placeholder={item.detailsPlaceholder}
                      className="w-full text-sm px-3 py-1.5 border rounded-md bg-input-background outline-none focus:border-[#4B5B32] transition-colors placeholder:text-muted-foreground/50"
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