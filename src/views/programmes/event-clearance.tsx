"use client";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { programmeRequest, useProgrammeData, panelClass } from "./shared";
import type { getEventClearanceReviews } from "@/lib/retreats/offering-clearance";
type Reviews = Awaited<ReturnType<typeof getEventClearanceReviews>>;
export function EventClearanceReview({ id }: { id: string }) {
  const endpoint = `/api/admin/retreats/${id}/clearance`;
  const { data, error, reload } = useProgrammeData<Reviews>(endpoint);
  const [message, setMessage] = useState("");
  return (
    <AdminLayout title="Event health clearance">
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <h1 className="text-3xl">Event health clearance</h1>
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        {data?.length === 0 && (
          <p>No participants have submitted health confirmation for this event yet.</p>
        )}
        {data?.map((r) => (
          <article key={r.id} className={panelClass}>
            <h2>
              {r.user.firstName} {r.user.lastName}
            </h2>
            <p>{r.status.replaceAll("_", " ")}</p>
            <details>
              <summary>Review current health information</summary>
              <p>{r.user.healthProfile?.additionalNotes}</p>
              <ul>
                {r.user.healthProfile?.selections.map((s) => (
                  <li key={s.id}>
                    {s.conditionKey}: {s.detail}
                  </li>
                ))}
              </ul>
            </details>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                try {
                  const result = await programmeRequest<{ cleared: boolean; reason?: string }[]>(
                    endpoint,
                    {
                      entries: [{ id: r.id, healthRevision: r.healthRevision }],
                      status: f.get("status"),
                      considerations: f.get("considerations"),
                    }
                  );
                  setMessage(
                    result[0]?.cleared ? "Review saved" : result[0]?.reason || "Unable to save"
                  );
                  reload();
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : "Unable to save");
                }
              }}
            >
              <label>
                Decision
                <select className="block rounded border p-2" name="status">
                  <option value="cleared">Cleared</option>
                  <option value="cleared_with_considerations">Cleared with considerations</option>
                  <option value="not_cleared">Not currently cleared</option>
                </select>
              </label>
              <label>
                Considerations
                <textarea
                  className="block w-full rounded border p-2"
                  name="considerations"
                  defaultValue={r.considerations}
                />
              </label>
              <Button type="submit">Save individual clearance</Button>
            </form>
          </article>
        ))}
      </div>
    </AdminLayout>
  );
}
