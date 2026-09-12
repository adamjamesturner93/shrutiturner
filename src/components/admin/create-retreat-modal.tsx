"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminRetreatTemplateDto } from "@/lib/api/types";

export interface CreateRetreatData {
  retreatSlug: string;
  title: string;
  location: string;
  retreatType: "in_person" | "online";
  startsAt: string;
  endsAt: string;
  capacity: number;
  pricePence: number;
  paymentPolicy: "deposit" | "full_payment";
  copyFromDateId?: string | null;
  earlyBirdPricePence?: number | null;
  earlyBirdEndsAt?: string | null;
}

export function CreateRetreatModal({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate?: (data: CreateRetreatData) => Promise<void> | void;
}) {
  const [templates, setTemplates] = useState<AdminRetreatTemplateDto[]>([]);
  const [slug, setSlug] = useState("");
  const [step, setStep] = useState(1);
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [copy, setCopy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selected = templates.find((template) => template.slug === slug);
  useEffect(() => {
    if (!open) return;
    let active = true;
    setStep(1);
    setCopy(false);
    setStarts("");
    setEnds("");
    setError("");
    void fetch("/api/admin/retreats/templates")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load experiences.");
        const data = (await response.json()) as AdminRetreatTemplateDto[];
        if (active) {
          setTemplates(data);
          setSlug(data[0]?.slug || "");
        }
      })
      .catch((error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [open]);
  async function createDraft() {
    if (!selected) return;
    const start = new Date(starts),
      end = new Date(ends);
    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      start <= new Date() ||
      end <= start
    ) {
      setError("Choose a future start and an end after the start.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onCreate?.({
        retreatSlug: selected.slug,
        title: selected.title,
        location: selected.location,
        retreatType: selected.retreatType,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        capacity: selected.capacity,
        pricePence: copy ? selected.pricePence : 0,
        paymentPolicy: copy
          ? selected.paymentPolicy
          : selected.retreatType === "online"
            ? "full_payment"
            : "deposit",
        copyFromDateId: copy ? selected.previousDate?.id : null,
      });
      onOpenChange(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to create draft.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) onOpenChange(value);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{step === 1 ? "1. Choose your experience" : "2. Set the dates"}</DialogTitle>
          <DialogDescription>
            Create a private draft, then review rooms or tickets, prices and payments before opening
            bookings.
          </DialogDescription>
        </DialogHeader>
        <ol
          className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-xs"
          aria-label="Setup steps"
        >
          <li>1. Experience</li>
          <li>2. Dates</li>
          <li>3. Rooms / tickets</li>
          <li>4. Prices & payment</li>
          <li>5. Review</li>
        </ol>
        {error ? (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        ) : null}
        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-experience">Published experience</Label>
              <select
                id="new-experience"
                className="bg-background h-11 w-full rounded-md border px-3"
                value={slug}
                onChange={(event) => {
                  setSlug(event.target.value);
                  setCopy(false);
                }}
              >
                <option value="">Choose an experience</option>
                {templates.map((template) => (
                  <option key={template.slug} value={template.slug}>
                    {template.title}
                  </option>
                ))}
              </select>
            </div>
            {selected ? (
              <p>
                {selected.retreatType === "online" ? "Live online workshop" : "Residential retreat"}{" "}
                · {selected.location}
              </p>
            ) : (
              <p className="text-muted-foreground">
                Publish the experience content in Contentful first. Opening bookings is a separate
                final step here.
              </p>
            )}
            {selected?.retreatType === "in_person" && !selected.venueRoomsConfigured ? (
              <p>
                Set up the venue's reusable rooms first.{" "}
                <Link href="/admin/retreats/venues" className="underline">
                  Open venue room setup
                </Link>
              </p>
            ) : null}
            {selected?.previousDate ? (
              <label className="flex gap-3 rounded-xl border p-4">
                <input
                  type="checkbox"
                  checked={copy}
                  onChange={(event) => setCopy(event.target.checked)}
                />
                <span>
                  Reuse settings from{" "}
                  {new Date(selected.previousDate.startsAt).toLocaleDateString("en-GB")}
                  <span className="text-muted-foreground mt-1 block text-sm">
                    Copies rooms/tickets, prices, payment rules and extras for review. Does not copy
                    bookings, guests or early-bird deadlines. Leave unticked to use the current
                    venue rooms and enter new prices.
                  </span>
                </span>
              </label>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-medium">{selected?.title}</p>
            <p className="text-muted-foreground text-sm">
              Enter times in your browser's timezone (
              {Intl.DateTimeFormat().resolvedOptions().timeZone}). The event is displayed in
              Europe/London; review the converted times on the draft.
            </p>
            <div>
              <Label htmlFor="new-start">Arrival / start</Label>
              <Input
                id="new-start"
                type="datetime-local"
                value={starts}
                onChange={(event) => setStarts(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="new-end">Departure / end</Label>
              <Input
                id="new-end"
                type="datetime-local"
                value={ends}
                onChange={(event) => setEnds(event.target.value)}
              />
            </div>
            <p className="text-muted-foreground text-sm">
              Nothing becomes bookable yet. Next you will confirm capacity, prices and payment
              rules.
            </p>
          </div>
        )}
        <DialogFooter>
          {step > 1 ? (
            <Button variant="outline" disabled={busy} onClick={() => setStep(1)}>
              Back
            </Button>
          ) : null}
          <Button
            disabled={
              busy ||
              !selected ||
              (selected.retreatType === "in_person" && !selected.venueRoomsConfigured) ||
              (step === 2 && (!starts || !ends))
            }
            onClick={() => (step === 1 ? setStep(2) : void createDraft())}
          >
            {busy ? "Creating…" : step === 1 ? "Next: dates" : "Create draft and continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
