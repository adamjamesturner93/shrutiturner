"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, CheckCircle, Info, Link2, PoundSterling, Video } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import type { AdminRetreatTemplateDto } from "@/lib/api/types";

interface CreateRetreatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate?: (data: CreateRetreatData) => Promise<void> | void;
}

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
  earlyBirdPricePence?: number | null;
  earlyBirdEndsAt?: string | null;
}

function toPence(value: string) {
  const pounds = Number(value);
  if (!Number.isFinite(pounds) || pounds < 0) return 0;
  return Math.round(pounds * 100);
}

export function CreateRetreatModal({ open, onOpenChange, onCreate }: CreateRetreatModalProps) {
  const [templates, setTemplates] = useState<AdminRetreatTemplateDto[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [retreatSlug, setRetreatSlug] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [retreatType, setRetreatType] = useState<"in_person" | "online">("in_person");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState(10);
  const [pricePounds, setPricePounds] = useState("0");
  const [paymentPolicy, setPaymentPolicy] = useState<"deposit" | "full_payment">("deposit");
  const [earlyBirdPricePounds, setEarlyBirdPricePounds] = useState("");
  const [earlyBirdEndsAt, setEarlyBirdEndsAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const hasEarlyBirdPrice = earlyBirdPricePounds.trim().length > 0;
  const hasEarlyBirdEndDate = earlyBirdEndsAt.length > 0;
  const canSubmit =
    retreatSlug.trim().length > 0 &&
    title.trim().length > 0 &&
    location.trim().length > 0 &&
    startsAt.length > 0 &&
    endsAt.length > 0 &&
    capacity > 0 &&
    hasEarlyBirdPrice === hasEarlyBirdEndDate;

  const applyPreset = useCallback((slug: string, availableTemplates: AdminRetreatTemplateDto[]) => {
    const preset = availableTemplates.find((item) => item.slug === slug);
    if (!preset) {
      setRetreatSlug(slug);
      return;
    }
    setRetreatSlug(preset.slug);
    setTitle(preset.title);
    setLocation(preset.location);
    setRetreatType(preset.retreatType);
    setPaymentPolicy(preset.paymentPolicy);
    setCapacity(preset.capacity);
    setPricePounds(String(preset.pricePence / 100));
    setEarlyBirdPricePounds("");
    setEarlyBirdEndsAt("");
  }, []);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setTemplatesLoading(true);
    setSubmitError("");
    void fetch("/api/admin/retreats/templates", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load Contentful experiences.");
        return (await response.json()) as AdminRetreatTemplateDto[];
      })
      .then((items) => {
        if (!active) return;
        setTemplates(items);
        if (items.length > 0) applyPreset(items[0].slug, items);
      })
      .catch((error) => {
        if (active) {
          setSubmitError(error instanceof Error ? error.message : "Failed to load experiences.");
        }
      })
      .finally(() => {
        if (active) setTemplatesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyPreset, open]);

  function resetAndClose() {
    setSubmitting(false);
    setSubmitError("");
    onOpenChange(false);
  }

  async function handleCreate() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await onCreate?.({
        retreatSlug: retreatSlug.trim(),
        title: title.trim(),
        location: location.trim(),
        retreatType,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        capacity,
        pricePence: toPence(pricePounds),
        paymentPolicy: retreatType === "online" ? "full_payment" : paymentPolicy,
        earlyBirdPricePence: hasEarlyBirdPrice ? toPence(earlyBirdPricePounds) : null,
        earlyBirdEndsAt: hasEarlyBirdEndDate ? new Date(earlyBirdEndsAt).toISOString() : null,
      });
      resetAndClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create date.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create retreat or workshop date</DialogTitle>
          <DialogDescription>
            Create the operational date, ticket inventory and payment setup for an existing
            Contentful experience slug.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="text-muted-foreground bg-secondary/50 flex items-start gap-2 rounded-md p-3 text-xs">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>
              Editorial copy, images and long-form details stay in Contentful. This form creates the
              dated booking record in the website database. Online workshops get a live ticket
              option and full-payment rule automatically.
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="retreat-preset" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Existing experience
            </Label>
            <select
              id="retreat-preset"
              value={retreatSlug}
              onChange={(event) => applyPreset(event.target.value, templates)}
              className="border-input bg-input-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-[3px]"
            >
              {templates.map((experience) => (
                <option key={experience.slug} value={experience.slug}>
                  {experience.title}
                </option>
              ))}
            </select>
            {templatesLoading ? (
              <p className="text-muted-foreground text-xs">Loading published experiences...</p>
            ) : templates.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                Publish an experience in Contentful before creating a date.
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="retreat-slug">Contentful experience slug</Label>
              <Input
                id="retreat-slug"
                value={retreatSlug}
                onChange={(event) => setRetreatSlug(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retreat-type" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Type
              </Label>
              <select
                id="retreat-type"
                value={retreatType}
                onChange={(event) => {
                  const nextType = event.target.value === "online" ? "online" : "in_person";
                  setRetreatType(nextType);
                  setPaymentPolicy(nextType === "online" ? "full_payment" : "deposit");
                }}
                className="border-input bg-input-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-[3px]"
              >
                <option value="online">Online workshop</option>
                <option value="in_person">In-person retreat</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="retreat-payment-policy">Payment policy</Label>
            <select
              id="retreat-payment-policy"
              value={retreatType === "online" ? "full_payment" : paymentPolicy}
              disabled={retreatType === "online"}
              onChange={(event) =>
                setPaymentPolicy(event.target.value === "full_payment" ? "full_payment" : "deposit")
              }
              className="border-input bg-input-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="deposit">Deposit, then balance later</option>
              <option value="full_payment">Full payment required</option>
            </select>
            <p className="text-muted-foreground text-xs">
              Full-payment-only dates do not receive the separate pay-in-full discount. Online
              workshops always require full payment.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="retreat-title">Public title snapshot</Label>
            <Input
              id="retreat-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="retreat-location">Location snapshot</Label>
            <Input
              id="retreat-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="retreat-start" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Starts
              </Label>
              <input
                id="retreat-start"
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                className="border-input bg-input-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-[3px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retreat-end">Ends</Label>
              <input
                id="retreat-end"
                type="datetime-local"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
                className="border-input bg-input-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-[3px]"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="retreat-capacity">Capacity</Label>
              <Input
                id="retreat-capacity"
                type="number"
                min={1}
                max={200}
                value={capacity}
                onChange={(event) => setCapacity(Number.parseInt(event.target.value, 10) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retreat-price" className="flex items-center gap-2">
                <PoundSterling className="h-4 w-4" />
                Standard price
              </Label>
              <Input
                id="retreat-price"
                type="number"
                min={0}
                step={1}
                value={pricePounds}
                onChange={(event) => setPricePounds(event.target.value)}
              />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Early bird pricing</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Optional. If set, checkout uses this lower price until the end date, then
                automatically reverts to the standard price.
              </p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="retreat-early-bird-price" className="flex items-center gap-2">
                  <PoundSterling className="h-4 w-4" />
                  Early bird price
                </Label>
                <Input
                  id="retreat-early-bird-price"
                  type="number"
                  min={0}
                  step={1}
                  value={earlyBirdPricePounds}
                  onChange={(event) => setEarlyBirdPricePounds(event.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retreat-early-bird-end">Early bird ends</Label>
                <input
                  id="retreat-early-bird-end"
                  type="datetime-local"
                  value={earlyBirdEndsAt}
                  onChange={(event) => setEarlyBirdEndsAt(event.target.value)}
                  className="border-input bg-input-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-[3px]"
                />
              </div>
            </div>
            {hasEarlyBirdPrice !== hasEarlyBirdEndDate ? (
              <p className="mt-3 text-xs text-red-700">
                Add both an early bird price and an end date, or leave both blank.
              </p>
            ) : null}
          </div>

          {submitError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!canSubmit || submitting || templatesLoading}>
            <CheckCircle className="mr-2 h-4 w-4" />
            {submitting ? "Creating..." : "Create date"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
