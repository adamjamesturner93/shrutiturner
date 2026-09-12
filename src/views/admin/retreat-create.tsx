"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RetreatImageField } from "@/components/admin/retreat-image-field";
import { UnsavedChangesGuard } from "@/components/unsaved-changes-guard";
import { eventWallTimeToIso, eventIsoToWallTime } from "@/lib/retreats/event-time";

type EventKind = "residential_retreat" | "day_retreat" | "in_person_workshop" | "online_workshop";

type ExperienceContent = {
  schemaVersion: 1;
  title: string;
  subtitle: string;
  shortDescription: string;
  fullDescription: string;
  scheduleMarkdown: string;
  atmosphereDescription: string;
  audienceDescription: string;
  experienceLevel: string;
  suitableFor: string[];
  included: string[];
  notIncluded: string[];
  whatToBring: string[];
  foodAndDrinkDescription: string;
  accommodationDescription: string;
  durationLabel: string;
  gallery: Array<{
    assetId?: string;
    url: string;
    alt: string;
    focalPoint: { x: number; y: number };
  }>;
  image?: {
    assetId?: string;
    url: string;
    alt: string;
    focalPoint: { x: number; y: number };
  };
  seoTitle: string;
  seoDescription: string;
};

type FormatOption = {
  id: string;
  name: string;
  description: string | null;
  eventKind: EventKind;
  starterContent: ExperienceContent;
  operationalDefaults: {
    capacity: number;
    pricePence: number;
    durationMinutes?: number;
    timezone?: string;
    venueProfileId?: string;
  };
};

type ExperienceOption = {
  id: string;
  slug: string;
  title: string;
  eventKind: EventKind;
  formatPresetId: string | null;
  revision: number;
  publishedAt: string | null;
  publishedContent: ExperienceContent | null;
};

type VenueOption = {
  contentfulVenueId: string;
  name: string;
  displayLocation: string;
  configured: boolean;
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: { message?: string };
  message?: string;
};

const EVENT_KIND_LABELS: Record<EventKind, string> = {
  residential_retreat: "Residential retreat",
  day_retreat: "Day retreat",
  in_person_workshop: "In-person workshop",
  online_workshop: "Live online workshop",
};

const EMPTY_CONTENT: ExperienceContent = {
  schemaVersion: 1,
  title: "",
  subtitle: "",
  shortDescription: "",
  fullDescription: "",
  scheduleMarkdown: "",
  atmosphereDescription: "",
  audienceDescription: "",
  experienceLevel: "",
  suitableFor: [],
  included: [],
  notIncluded: [],
  whatToBring: [],
  foodAndDrinkDescription: "",
  accommodationDescription: "",
  durationLabel: "",
  gallery: [],
  seoTitle: "",
  seoDescription: "",
};

function lines(value: string) {
  return value
    .split("\n")
    .map((item) => item.replace(/^\s*[-*]\s+/, "").trim())
    .filter(Boolean);
}

async function readApi<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok) {
    throw new Error(
      payload?.error?.message || payload?.message || "The request could not be completed."
    );
  }
  return (payload?.data ?? payload) as T;
}

export function AdminRetreatCreate({
  formats,
  experiences,
  venues,
}: {
  formats: FormatOption[];
  experiences: ExperienceOption[];
  venues: VenueOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const creationKey = useRef<string | null>(null);
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("creation");
    if (!key || !/^[a-f0-9-]{36}$/i.test(key)) return;
    creationKey.current = key;
    const controller = new AbortController();
    void fetch(`/api/admin/retreats/create-draft?key=${encodeURIComponent(key)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await readApi<{ id: string } | null>(response);
        if (result?.id) router.replace(`/admin/retreats/${result.id}?section=setup`);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Could not check the saved event. Retry before creating another."
          );
      });
    return () => controller.abort();
  }, [router]);
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<"new" | "repeat">("new");
  const [formatId, setFormatId] = useState(formats[0]?.id || "");
  const [experienceId, setExperienceId] = useState("");
  const selectedFormat = formats.find((format) => format.id === formatId) || null;
  const selectedExperience =
    mode === "repeat"
      ? experiences.find((experience) => experience.id === experienceId) || null
      : null;
  const eventKind = selectedExperience?.eventKind || selectedFormat?.eventKind || "online_workshop";
  const [content, setContent] = useState<ExperienceContent>(
    selectedFormat?.starterContent || EMPTY_CONTENT
  );
  const [listFields, setListFields] = useState({
    suitableFor: (selectedFormat?.starterContent.suitableFor || []).join("\n"),
    included: (selectedFormat?.starterContent.included || []).join("\n"),
    whatToBring: (selectedFormat?.starterContent.whatToBring || []).join("\n"),
  });
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const endTimeEdited = useRef(false);
  const eventTimezone = selectedFormat?.operationalDefaults.timezone || "Europe/London";
  function changeStart(value: string) {
    setStartsAt(value);
    if (!endTimeEdited.current && selectedFormat?.operationalDefaults.durationMinutes) {
      try {
        const start = eventWallTimeToIso(value, eventTimezone);
        setEndsAt(
          eventIsoToWallTime(
            new Date(
              Date.parse(start) + selectedFormat.operationalDefaults.durationMinutes * 60000
            ).toISOString(),
            eventTimezone
          )
        );
      } catch {
        /* Incomplete or ambiguous input is validated before submission. */
      }
    }
  }
  const [venueId, setVenueId] = useState(venues[0]?.contentfulVenueId || "");
  const [capacity, setCapacity] = useState(selectedFormat?.operationalDefaults.capacity || 12);
  const [price, setPrice] = useState(
    ((selectedFormat?.operationalDefaults.pricePence || 0) / 100).toString()
  );
  const publishContent = false;
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const draftFingerprint = JSON.stringify({
    mode,
    formatId,
    experienceId,
    content,
    listFields,
    startsAt,
    endsAt,
    venueId,
    capacity,
    price,
  });
  const [initialFingerprint] = useState(draftFingerprint);
  const requiresVenue = eventKind !== "online_workshop";
  const requiresRooms = eventKind === "residential_retreat";
  const selectedVenue = venues.find((venue) => venue.contentfulVenueId === venueId) || null;

  const effectiveContent = useMemo(
    () => ({
      ...content,
      suitableFor: lines(listFields.suitableFor),
      included: lines(listFields.included),
      whatToBring: lines(listFields.whatToBring),
      image: content.image?.url && content.image.alt ? content.image : undefined,
    }),
    [content, listFields]
  );

  function chooseFormat(nextId: string) {
    setFormatId(nextId);
    const format = formats.find((candidate) => candidate.id === nextId);
    if (!format) return;
    setContent(format.starterContent);
    setListFields({
      suitableFor: format.starterContent.suitableFor.join("\n"),
      included: format.starterContent.included.join("\n"),
      whatToBring: format.starterContent.whatToBring.join("\n"),
    });
    setCapacity(format.operationalDefaults.capacity);
    setPrice((format.operationalDefaults.pricePence / 100).toString());
  }

  function chooseExperience(nextId: string) {
    setExperienceId(nextId);
    const experience = experiences.find((candidate) => candidate.id === nextId);
    const format = formats.find((candidate) => candidate.id === experience?.formatPresetId);
    if (!format) return;
    setFormatId(format.id);
    setCapacity(format.operationalDefaults.capacity);
    setPrice((format.operationalDefaults.pricePence / 100).toString());
  }

  function validateStep(currentStep: number) {
    if (mode === "new" && content.image?.url.trim() && !content.image.alt.trim())
      return "Add alternative text for the event image.";
    if (currentStep === 1 && mode === "new" && !selectedFormat) return "Choose a saved format.";
    if (currentStep === 1 && mode === "repeat" && !selectedExperience)
      return "Choose an existing event page.";
    if (currentStep === 2 && mode === "new" && !effectiveContent.title.trim())
      return "Add the event title.";
    if (currentStep === 2 && mode === "new" && publishContent) {
      if (
        !effectiveContent.shortDescription ||
        !effectiveContent.fullDescription ||
        !effectiveContent.scheduleMarkdown
      ) {
        return "Add the summary, description and schedule before publishing.";
      }
    }
    if (currentStep === 3) {
      const starts = new Date(startsAt);
      const ends = new Date(endsAt);
      if (!Number.isFinite(starts.getTime()) || starts <= new Date())
        return "Choose a future start date.";
      if (!Number.isFinite(ends.getTime()) || ends <= starts)
        return "Choose an end after the start.";
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200)
        return "Capacity must be between 1 and 200.";
      if (!Number.isFinite(Number(price)) || Number(price) < 0) return "Enter a valid price.";
      if (requiresVenue && !selectedVenue) return "Choose a venue.";
      if (requiresRooms && !selectedVenue?.configured)
        return "Configure this venue's rooms before creating a residential retreat.";
    }
    return "";
  }

  function next() {
    const message = validateStep(step);
    if (message) return setError(message);
    setError("");
    setStep((value) => Math.min(value + 1, 4));
  }

  async function submit() {
    const message = validateStep(3);
    if (message) {
      setStep(3);
      setError(message);
      return;
    }
    setBusy(true);
    setError("");
    try {
      creationKey.current ||= crypto.randomUUID();
      window.history.replaceState(null, "", `/admin/retreats/new?creation=${creationKey.current}`);
      const created = await readApi<{ id: string }>(
        await fetch("/api/admin/retreats/create-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestKey: creationKey.current,
            experienceId: mode === "repeat" ? selectedExperience?.id : undefined,
            content: mode === "new" ? effectiveContent : undefined,
            formatPresetId:
              mode === "new" ? selectedFormat?.id : selectedExperience?.formatPresetId || undefined,
            venueContentfulId: requiresVenue ? venueId : null,
            startsAt: eventWallTimeToIso(startsAt, eventTimezone),
            endsAt: eventWallTimeToIso(endsAt, eventTimezone),
            capacity,
            pricePence: Math.round(Number(price) * 100),
          }),
        })
      );
      setLeaving(true);
      router.push(`/admin/retreats/${created.id}?section=setup`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create the event.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminLayout title="Create event - Admin">
      <UnsavedChangesGuard
        dirty={!leaving && draftFingerprint !== initialFingerprint}
        onDiscard={() => setLeaving(true)}
      />
      <div className="mx-auto max-w-5xl space-y-6">
        <Button asChild variant="ghost" className="-ml-3">
          <Link href="/admin/retreats">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retreats and workshops
          </Link>
        </Button>
        <div>
          <h1 className="text-brand-dark text-3xl">Create an event</h1>
          <p className="text-muted-foreground mt-2">
            Choose a reusable format, add the theme, then set the bookable date.
          </p>
        </div>
        <ol className="grid gap-2 sm:grid-cols-4" aria-label="Creation progress">
          {["Format", "Theme", "Date & price", "Review"].map((label, index) => (
            <li
              key={label}
              className={`rounded-lg border px-3 py-2 text-sm ${step === index + 1 ? "border-primary bg-primary/5 font-medium" : "text-muted-foreground"}`}
            >
              {index + 1}. {label}
            </li>
          ))}
        </ol>
        {error ? (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4"
          >
            {error}
          </div>
        ) : null}

        <Card>
          <CardContent className="space-y-6 pt-6">
            {step === 1 ? (
              <>
                <fieldset className="space-y-3">
                  <legend className="text-lg font-medium">What are you creating?</legend>
                  <label className="flex gap-3 rounded-lg border p-4">
                    <input
                      type="radio"
                      name="mode"
                      checked={mode === "new"}
                      onChange={() => setMode("new")}
                    />
                    <span>
                      <strong>A new theme</strong>
                      <span className="text-muted-foreground block text-sm">
                        Start from a saved format and create a new public page.
                      </span>
                    </span>
                  </label>
                  <label className="flex gap-3 rounded-lg border p-4">
                    <input
                      type="radio"
                      name="mode"
                      checked={mode === "repeat"}
                      onChange={() => setMode("repeat")}
                    />
                    <span>
                      <strong>Another date for an existing theme</strong>
                      <span className="text-muted-foreground block text-sm">
                        Reuse its public page and add one new dated card.
                      </span>
                    </span>
                  </label>
                </fieldset>
                {mode === "new" ? (
                  <div>
                    <Label htmlFor="event-format">Saved format</Label>
                    <select
                      id="event-format"
                      value={formatId}
                      onChange={(event) => chooseFormat(event.target.value)}
                      className="bg-background h-11 w-full rounded-md border px-3"
                    >
                      <option value="">Choose a format</option>
                      {formats.map((format) => (
                        <option key={format.id} value={format.id}>
                          {format.name} · {EVENT_KIND_LABELS[format.eventKind]}
                        </option>
                      ))}
                    </select>
                    {formats.length === 0 ? (
                      <p className="text-muted-foreground mt-2 text-sm">
                        No saved formats exist yet. Create the initial formats from the
                        migration/seed before using this flow.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="existing-experience">Existing theme</Label>
                    <select
                      id="existing-experience"
                      value={experienceId}
                      onChange={(event) => chooseExperience(event.target.value)}
                      className="bg-background h-11 w-full rounded-md border px-3"
                    >
                      <option value="">Choose a theme</option>
                      {experiences.map((experience) => (
                        <option key={experience.id} value={experience.id}>
                          {experience.title}
                          {experience.publishedAt ? "" : " · draft"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            ) : null}

            {step === 2 ? (
              mode === "repeat" ? (
                <div className="space-y-3">
                  <h2 className="text-2xl">Reuse {selectedExperience?.title}</h2>
                  <p className="text-muted-foreground">
                    This date will use the same themed page. Draft copy will not be published as
                    part of adding the date.
                  </p>
                  {!selectedExperience?.publishedAt ? (
                    <p className="text-amber-700">
                      The page is still a draft. You can create the operational date, but bookings
                      cannot open until the page is published.
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="grid gap-5">
                  <div>
                    <Label htmlFor="theme-title">Event title</Label>
                    <Input
                      id="theme-title"
                      value={content.title}
                      onChange={(event) =>
                        setContent((value) => ({ ...value, title: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="theme-subtitle">Short introduction</Label>
                    <Textarea
                      id="theme-subtitle"
                      value={content.subtitle}
                      onChange={(event) =>
                        setContent((value) => ({ ...value, subtitle: event.target.value }))
                      }
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="theme-summary">Card summary</Label>
                    <Textarea
                      id="theme-summary"
                      value={content.shortDescription}
                      onChange={(event) =>
                        setContent((value) => ({ ...value, shortDescription: event.target.value }))
                      }
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="theme-description">Full description</Label>
                    <Textarea
                      id="theme-description"
                      value={content.fullDescription}
                      onChange={(event) =>
                        setContent((value) => ({ ...value, fullDescription: event.target.value }))
                      }
                      rows={7}
                    />
                  </div>
                  <div>
                    <Label htmlFor="theme-schedule">Schedule</Label>
                    <p className="text-muted-foreground mb-2 text-sm">
                      One Markdown textbox. Use headings and bullet points for longer events.
                    </p>
                    <Textarea
                      id="theme-schedule"
                      value={content.scheduleMarkdown}
                      onChange={(event) =>
                        setContent((value) => ({ ...value, scheduleMarkdown: event.target.value }))
                      }
                      rows={10}
                    />
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <Label htmlFor="theme-included">Included, one per line</Label>
                      <Textarea
                        id="theme-included"
                        value={listFields.included}
                        onChange={(event) =>
                          setListFields((value) => ({ ...value, included: event.target.value }))
                        }
                        rows={5}
                      />
                    </div>
                    <div>
                      <Label htmlFor="theme-for">Who it is for, one per line</Label>
                      <Textarea
                        id="theme-for"
                        value={listFields.suitableFor}
                        onChange={(event) =>
                          setListFields((value) => ({ ...value, suitableFor: event.target.value }))
                        }
                        rows={5}
                      />
                    </div>
                  </div>
                  <RetreatImageField
                    id="theme-image"
                    value={content.image}
                    onChange={(image) => setContent((value) => ({ ...value, image }))}
                  />
                  <p className="text-muted-foreground rounded-lg border p-4 text-sm">
                    Your new event page and date will be saved privately. Publish the page and open
                    bookings separately after reviewing setup.
                  </p>
                </div>
              )
            ) : null}

            {step === 3 ? (
              <div className="grid gap-5">
                <div className="rounded-lg border p-4">
                  <p className="font-medium">{EVENT_KIND_LABELS[eventKind]}</p>
                  <p className="text-muted-foreground text-sm">
                    Enter times in {eventTimezone}. Your browser timezone will not change the event
                    time.
                  </p>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <Label htmlFor="event-start">Start / arrival</Label>
                    <Input
                      id="event-start"
                      type="datetime-local"
                      value={startsAt}
                      onChange={(event) => changeStart(event.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="event-end">End / departure</Label>
                    <Input
                      id="event-end"
                      type="datetime-local"
                      value={endsAt}
                      onChange={(event) => {
                        endTimeEdited.current = true;
                        setEndsAt(event.target.value);
                      }}
                    />
                  </div>
                </div>
                {requiresVenue ? (
                  <div>
                    <Label htmlFor="event-venue">Venue</Label>
                    <select
                      id="event-venue"
                      value={venueId}
                      onChange={(event) => setVenueId(event.target.value)}
                      className="bg-background h-11 w-full rounded-md border px-3"
                    >
                      <option value="">Choose a venue</option>
                      {venues.map((venue) => (
                        <option key={venue.contentfulVenueId} value={venue.contentfulVenueId}>
                          {venue.name} · {venue.displayLocation}
                          {requiresRooms && !venue.configured ? " · rooms needed" : ""}
                        </option>
                      ))}
                    </select>
                    {requiresRooms && selectedVenue && !selectedVenue.configured ? (
                      <p className="mt-2 text-sm">
                        <Link className="underline" href="/admin/retreats/venues">
                          Configure this venue's rooms
                        </Link>{" "}
                        before continuing.
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <Label htmlFor="event-capacity">Total places</Label>
                    <Input
                      id="event-capacity"
                      type="number"
                      min={1}
                      max={200}
                      value={capacity}
                      onChange={(event) => setCapacity(Number(event.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="event-price">Starting price (£)</Label>
                    <Input
                      id="event-price"
                      type="number"
                      min={0}
                      step="0.01"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                    />
                    <p className="text-muted-foreground mt-1 text-xs">
                      You will review all room or ticket prices before opening bookings.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-5">
                <h2 className="text-2xl">Review your draft</h2>
                <dl className="grid gap-4 rounded-lg border p-5 sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground text-sm">Theme</dt>
                    <dd>{mode === "new" ? effectiveContent.title : selectedExperience?.title}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-sm">Format</dt>
                    <dd>{EVENT_KIND_LABELS[eventKind]}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-sm">Date</dt>
                    <dd>
                      {new Date(startsAt).toLocaleString("en-GB")} –{" "}
                      {new Date(endsAt).toLocaleString("en-GB")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-sm">Price and capacity</dt>
                    <dd>
                      From £{Number(price).toFixed(2)} · {capacity} places
                    </dd>
                  </div>
                  {requiresVenue ? (
                    <div>
                      <dt className="text-muted-foreground text-sm">Venue</dt>
                      <dd>{selectedVenue?.name}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-muted-foreground text-sm">Visibility</dt>
                    <dd>
                      {mode === "new" && publishContent
                        ? "Page published; booking date stays draft"
                        : "Private draft"}
                    </dd>
                  </div>
                </dl>
                <p className="text-muted-foreground">
                  The date stays private. Next you will review tickets or room prices, payment rules
                  and the opening checklist.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            disabled={step === 1 || busy}
            onClick={() => {
              setError("");
              setStep((value) => Math.max(value - 1, 1));
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {step < 4 ? (
            <Button onClick={next}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button disabled={busy} onClick={() => void submit()}>
              {busy ? "Creating…" : "Create draft and continue"}
              <Save className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
