"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Preview = { available: boolean; bookingCount: number; guestCount: number; giftCount: number; refundPence: number; version: string };
export function RetreatCancellationDialog({ id, title, onCancelled }: { id: string; title: string; onCancelled: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function load() {
    setOpen(true); setPreview(null); setError(""); setBusy(true);
    try { const res = await fetch(`/api/admin/retreats/${id}/cancel`, { cache: "no-store" }); if (!res.ok) throw new Error("Could not load the cancellation summary."); setPreview(await res.json()); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to load summary."); }
    finally { setBusy(false); }
  }
  async function cancel() {
    if (!preview) return;
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/admin/retreats/${id}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason, expectedVersion: preview.version }) });
      if (!res.ok) { const body = await res.json().catch(() => null); throw new Error(body?.error?.message || "Cancellation could not be completed. Refresh the event before trying again."); }
      await onCancelled(); setOpen(false);
    } catch (error) { setError(error instanceof Error ? error.message : "Cancellation could not be completed."); }
    finally { setBusy(false); }
  }
  return <details className="relative"><summary className="cursor-pointer rounded-md border px-3 py-2 text-sm">More actions</summary>
    <Button className="mt-2" variant="outline" onClick={() => void load()}>Cancel event…</Button>
    <Dialog open={open} onOpenChange={(value) => { if (!busy) setOpen(value); }}><DialogContent><DialogHeader><DialogTitle>Cancel {title}?</DialogTitle><DialogDescription>This closes bookings and starts eligible refunds and cancellation notifications. Refunds may remain queued or need follow-up; they are not guaranteed to finish immediately.</DialogDescription></DialogHeader>
      {error ? <div role="alert"><p>{error}</p><Button variant="outline" disabled={busy} onClick={() => void load()}>Reload summary</Button></div> : null}
      {preview ? <div className="rounded-lg border p-3 text-sm"><p>{preview.bookingCount} bookings · {preview.guestCount} guests · {preview.giftCount} unredeemed gift purchases</p><p className="mt-2 font-medium">Eligible refunds: {(preview.refundPence / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP" })}</p>{!preview.available ? <p>This event can no longer be cancelled.</p> : null}</div> : <p role="status">{busy ? "Loading cancellation summary…" : "Summary unavailable"}</p>}
      <Label htmlFor="event-cancellation-reason">Reason for cancellation</Label><Textarea id="event-cancellation-reason" maxLength={2000} value={reason} onChange={(event) => setReason(event.target.value)} />
      <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>Keep event</Button><Button variant="destructive" disabled={busy || !preview?.available || !reason.trim() || Boolean(error)} onClick={() => void cancel()}>{busy ? "Working…" : "Cancel event and start refunds"}</Button></DialogFooter>
    </DialogContent></Dialog>
  </details>;
}
