"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AdminLayout } from "@/components/admin-layout";
import { AppPageHeader } from "@/components/app-surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type EventKind = "residential_retreat" | "day_retreat" | "in_person_workshop" | "online_workshop";
type Format = {
  id: string;
  name: string;
  description: string | null;
  eventKind: EventKind;
  active: boolean;
  revision: number;
  operationalDefaults: {
    schemaVersion: 1;
    timezone: string;
    capacity: number;
    currency: "GBP";
    pricePence: number;
    paymentPolicy: "deposit" | "full_payment";
    durationMinutes?: number;
    venueProfileId?: string;
    isRecorded: boolean;
    replayAccessDurationDays?: number;
    chatEnabled: boolean;
  };
};
type Envelope = { success?: boolean; data?: Format; error?: { message?: string } };

const LABELS: Record<EventKind, string> = {
  residential_retreat: "Residential retreat",
  day_retreat: "Day retreat",
  in_person_workshop: "In-person workshop",
  online_workshop: "Online workshop",
};

export function AdminRetreatFormats({ initialData }: { initialData: Format[] }) {
  const [formats, setFormats] = useState(initialData);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<EventKind>("online_workshop");
  const [newDescription, setNewDescription] = useState("");
  const [newCapacity, setNewCapacity] = useState("20");
  const [newPrice, setNewPrice] = useState("0");
  const [newDuration, setNewDuration] = useState("");

  async function create() {
    if (busy) return;
    setCreateError("");
    if (!/^\d+(\.\d{1,2})?$/.test(newPrice)) {
      setCreateError("Enter a price in pounds with at most two decimal places.");
      return;
    }
    setBusy("new");
    try {
      const response = await fetch("/api/admin/retreats/formats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDescription,
          eventKind: newKind,
          operationalDefaults: {
            timezone: "Europe/London",
            capacity: Number(newCapacity),
            pricePence: Math.round(Number(newPrice) * 100),
            durationMinutes: newDuration ? Number(newDuration) : undefined,
            paymentPolicy: newKind === "residential_retreat" ? "deposit" : "full_payment",
          },
        }),
      });
      const payload = (await response.json()) as Envelope;
      if (!response.ok || !payload.data)
        throw new Error(payload.error?.message || "Unable to create format.");
      const created = payload.data;
      setFormats((current) => [created, ...current]);
      setMessage(`${created.name} created. It is now available when creating events.`);
      setCreating(false);
      setNewName("");
      setNewDescription("");
      setNewDuration("");
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Unable to create format.");
    } finally {
      setBusy("");
    }
  }

  function update(id: string, change: (format: Format) => Format) {
    setFormats((current) => current.map((format) => (format.id === id ? change(format) : format)));
  }

  async function save(format: Format) {
    setBusy(format.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/retreats/formats/${format.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revision: format.revision,
          name: format.name,
          description: format.description,
          active: format.active,
          operationalDefaults: format.operationalDefaults,
        }),
      });
      const payload = (await response.json().catch(() => null)) as Envelope | null;
      if (!response.ok || !payload?.data)
        throw new Error(payload?.error?.message || "Unable to save this format.");
      setFormats((current) =>
        current.map((item) => (item.id === format.id ? payload.data! : item))
      );
      setMessage(`${payload.data.name} saved.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save this format.");
    } finally {
      setBusy("");
    }
  }

  return (
    <AdminLayout title="Event formats - Admin">
      <div className="space-y-6">
        <AppPageHeader
          eyebrow="Retreats and workshops"
          title="Saved formats"
          description="Formats hold sensible starting values for new events. Changing one never alters dates or pages you already created."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/admin/retreats">Back to events</Link>
              </Button>
              <Button
                onClick={() => {
                  setCreateError("");
                  setCreating(true);
                }}
              >
                <Plus aria-hidden="true" />
                New format
              </Button>
            </div>
          }
        />
        {error ? (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4"
          >
            {error}
          </div>
        ) : null}
        {message ? (
          <div
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
          >
            {message}
          </div>
        ) : null}
        <div className="grid gap-5 lg:grid-cols-2">
          {formats.map((format) => (
            <Card key={format.id} className={!format.active ? "opacity-70" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle>{format.name}</CardTitle>
                  <Badge variant="outline">{LABELS[format.eventKind]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div>
                  <Label htmlFor={`${format.id}-name`}>Name</Label>
                  <Input
                    id={`${format.id}-name`}
                    value={format.name}
                    onChange={(event) =>
                      update(format.id, (current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor={`${format.id}-description`}>When to use it</Label>
                  <Textarea
                    id={`${format.id}-description`}
                    rows={3}
                    value={format.description || ""}
                    onChange={(event) =>
                      update(format.id, (current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor={`${format.id}-capacity`}>Default places</Label>
                    <Input
                      id={`${format.id}-capacity`}
                      type="number"
                      min="1"
                      max="500"
                      value={format.operationalDefaults.capacity}
                      onChange={(event) =>
                        update(format.id, (current) => ({
                          ...current,
                          operationalDefaults: {
                            ...current.operationalDefaults,
                            capacity: Number(event.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${format.id}-price`}>Starting price (£)</Label>
                    <Input
                      id={`${format.id}-price`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={format.operationalDefaults.pricePence / 100}
                      onChange={(event) =>
                        update(format.id, (current) => ({
                          ...current,
                          operationalDefaults: {
                            ...current.operationalDefaults,
                            pricePence: Math.round(Number(event.target.value) * 100),
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${format.id}-duration`}>Minutes</Label>
                    <Input
                      id={`${format.id}-duration`}
                      type="number"
                      min="1"
                      value={format.operationalDefaults.durationMinutes || ""}
                      onChange={(event) =>
                        update(format.id, (current) => ({
                          ...current,
                          operationalDefaults: {
                            ...current.operationalDefaults,
                            durationMinutes: event.target.value
                              ? Number(event.target.value)
                              : undefined,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={format.active}
                    onChange={(event) =>
                      update(format.id, (current) => ({ ...current, active: event.target.checked }))
                    }
                  />
                  <span>Offer this format when creating events</span>
                </label>
                <Button disabled={busy !== ""} onClick={() => void save(format)}>
                  {busy === format.id ? "Saving…" : "Save format"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Dialog
        open={creating}
        onOpenChange={(value) => {
          if (!busy) setCreating(value);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create a format</DialogTitle>
            <DialogDescription>
              A reusable starting point, such as a half-day workshop or weekend retreat. Choose an
              event type; its room, ticket and payment rules stay fixed. Existing events are
              unaffected.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void create();
            }}
          >
            <fieldset disabled={Boolean(busy)} className="space-y-4">
              <div>
                <Label htmlFor="new-format-name">Format name</Label>
                <Input
                  id="new-format-name"
                  required
                  maxLength={180}
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="new-format-kind">Event type</Label>
                <select
                  id="new-format-kind"
                  className="bg-background h-11 w-full rounded-md border px-3"
                  value={newKind}
                  onChange={(event) => setNewKind(event.target.value as EventKind)}
                >
                  {Object.entries(LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="new-format-description">When to use it</Label>
                <Textarea
                  id="new-format-description"
                  value={newDescription}
                  onChange={(event) => setNewDescription(event.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="new-format-capacity">Default places</Label>
                  <Input
                    id="new-format-capacity"
                    type="number"
                    required
                    min={1}
                    max={200}
                    step={1}
                    value={newCapacity}
                    onChange={(event) => setNewCapacity(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="new-format-price">Starting price (£)</Label>
                  <Input
                    id="new-format-price"
                    inputMode="decimal"
                    required
                    value={newPrice}
                    onChange={(event) => setNewPrice(event.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="new-format-duration">Duration in minutes (optional)</Label>
                <Input
                  id="new-format-duration"
                  type="number"
                  min={1}
                  max={20160}
                  step={1}
                  value={newDuration}
                  onChange={(event) => setNewDuration(event.target.value)}
                />
              </div>
              <p className="text-muted-foreground text-sm">
                Times start in Europe/London. You can adjust the date, timezone and prices when
                creating each event.
              </p>
              {createError ? (
                <p role="alert" className="text-destructive text-sm">
                  {createError}
                </p>
              ) : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
                <Button type="submit">{busy === "new" ? "Creating…" : "Create format"}</Button>
              </DialogFooter>
            </fieldset>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
