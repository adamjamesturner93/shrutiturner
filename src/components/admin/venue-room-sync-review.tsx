"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VenueSyncPreview } from "@/lib/retreats/venue-sync-service";

export function VenueRoomSyncReview({
  venueId,
  disabled,
}: {
  venueId: string;
  disabled?: boolean;
}) {
  const [preview, setPreview] = useState<VenueSyncPreview[] | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const url = `/api/admin/retreats/venues/${venueId}/sync`;
  async function review() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error((await response.json()).message);
      setPreview(await response.json());
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to review changes.");
    } finally {
      setBusy(false);
    }
  }
  async function apply(date: VenueSyncPreview) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateId: date.id,
          revision: date.revision,
          prices: Object.fromEntries(
            date.prices.map((price) => [
              price.key,
              Math.round(Number(prices[`${date.id}:${price.key}`]) * 100),
            ])
          ),
        }),
      });
      if (!response.ok) throw new Error((await response.json()).message);
      setMessage(`${date.title}: venue changes applied. Existing booking amounts are unchanged.`);
      await review();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to apply changes.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4 border-t p-6" aria-label="Apply venue rooms to retreats">
      <h3 className="text-lg">Update existing retreats</h3>
      <p className="text-muted-foreground text-sm">
        Saving the venue updates the template. Review how those changes affect each future retreat
        before applying them. Existing prices and bookings are preserved.
      </p>
      <Button
        type="button"
        variant="outline"
        disabled={busy || disabled}
        onClick={() => void review()}
      >
        Review changes for existing retreats
      </Button>
      {disabled && <p className="text-sm">Save your venue edits before reviewing.</p>}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {preview?.length === 0 && <p>No future residential retreats use this venue.</p>}
      {preview?.map((date) => (
        <div key={date.id} className="space-y-3 rounded-xl border p-4">
          <h4 className="font-semibold">
            <Link className="underline" href={`/admin/retreats/${date.id}`}>
              {date.title}
            </Link>
          </h4>
          <p className="text-sm">
            {new Intl.DateTimeFormat("en-GB", {
              dateStyle: "long",
              timeZone: "Europe/London",
            }).format(new Date(date.startsAt))}
          </p>
          {date.changes.length ? (
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {date.changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          ) : (
            <p>Room setup is up to date.</p>
          )}
          {date.conflicts.length > 0 && (
            <div className="text-destructive text-sm">
              <p className="font-semibold">Needs review before applying</p>
              <ul className="list-disc pl-5">
                {date.conflicts.map((conflict) => (
                  <li key={conflict}>{conflict}</li>
                ))}
              </ul>
            </div>
          )}
          {date.prices.map((price) => {
            const key = `${date.id}:${price.key}`;
            return (
              <div key={key}>
                <Label htmlFor={key}>
                  {price.label} · {price.guestCount} {price.guestCount === 1 ? "guest" : "guests"} —
                  total price (£)
                </Label>
                <Input
                  id={key}
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={prices[key] || ""}
                  onChange={(event) =>
                    setPrices((current) => ({ ...current, [key]: event.target.value }))
                  }
                />
              </div>
            );
          })}
          {date.changes.length > 0 && (
            <Button
              type="button"
              disabled={
                busy ||
                disabled ||
                date.conflicts.length > 0 ||
                date.prices.some((price) => !(Number(prices[`${date.id}:${price.key}`]) > 0))
              }
              onClick={() => void apply(date)}
            >
              Apply reviewed changes
            </Button>
          )}
        </div>
      ))}
    </section>
  );
}
