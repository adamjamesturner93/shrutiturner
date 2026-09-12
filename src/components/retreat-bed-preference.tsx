import { useId } from "react";
import { getBedPreferenceLabel, type BedPreference } from "@/lib/retreats/bed-preference";

export function RetreatBedPreference({
  value,
  onChange,
}: {
  value: BedPreference;
  onChange: (value: BedPreference) => void;
}) {
  const name = useId();
  return (
    <fieldset className="mt-6">
      <legend className="font-medium">How would you like the beds arranged?</legend>
      <p className="text-muted-foreground mt-1 text-sm">
        The same private room and price, with your choice of bed setup.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {(["double", "twin"] as const).map((choice) => (
          <label
            key={choice}
            className={`focus-within:ring-ring flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm focus-within:ring-2 ${value === choice ? "border-brand-accent bg-brand-accent/5" : "hover:bg-secondary/20"}`}
          >
            <input
              type="radio"
              name={name}
              value={choice}
              checked={value === choice}
              onChange={() => onChange(choice)}
              className="accent-primary h-4 w-4"
            />
            {getBedPreferenceLabel(choice)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
