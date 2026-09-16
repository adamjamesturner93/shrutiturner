"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { programmeRequest, panelClass } from "./shared";
import { eventWallTimeToIso } from "@/lib/retreats/event-time";
export function ProgrammeCreate({ cohorts }: { cohorts: { id: string; title: string }[] }) {
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <details className={panelClass}>
      <summary>Create another programme cohort</summary>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          try {
            const { id } = await programmeRequest<{ id: string }>("/api/admin/programmes/cohorts", {
              programmeTitle: String(f.get("programmeTitle")),
              title: String(f.get("title")),
              startDate: eventWallTimeToIso(`${f.get("startDate")}T00:00`, "Europe/London"),
              weeks: Number(f.get("weeks")),
              copyFrom: String(f.get("copyFrom")) || undefined,
            });
            router.push(`/admin/programmes/${id}`);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Unable to create draft");
          }
        }}
      >
        {error && <p role="alert">{error}</p>}
        {[
          ["programmeTitle", "Reusable programme title"],
          ["title", "Cohort title"],
          ["startDate", "Start date"],
          ["weeks", "Number of weeks"],
        ].map(([key, label]) => (
          <label key={key} className="block">
            {label}
            <input
              name={key}
              required
              type={key === "startDate" ? "date" : key === "weeks" ? "number" : "text"}
              min={key === "weeks" ? 1 : undefined}
              max={key === "weeks" ? 12 : undefined}
              className="block w-full rounded border p-2"
            />
          </label>
        ))}
        <label className="block">
          Copy curriculum from
          <select name="copyFrom" className="block w-full rounded border p-2">
            <option value="">Start with empty weeks</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit">Create draft</Button>
      </form>
    </details>
  );
}
