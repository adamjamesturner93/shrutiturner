"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, Save, Send } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { MarkdownContent } from "@/components/markdown-content";
import { RetreatImageField } from "@/components/admin/retreat-image-field";
import { AdminFormActions } from "@/components/admin/admin-form-actions";
import { AppPageHeader } from "@/components/app-surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  image?: {
    assetId?: string;
    url: string;
    alt: string;
    focalPoint: { x: number; y: number };
  };
  gallery: Array<{
    assetId?: string;
    url: string;
    alt: string;
    focalPoint: { x: number; y: number };
  }>;
  seoTitle: string;
  seoDescription: string;
};

export type RetreatExperienceEditorData = {
  id: string;
  slug: string;
  title: string;
  eventKind: EventKind;
  draftContent: ExperienceContent;
  publishedContent: ExperienceContent | null;
  revision: number;
  publishedRevision: number | null;
  publishedAt: string | null;
  sourceContentfulEntryId: string | null;
  hasUnpublishedChanges: boolean;
};

type ApiEnvelope<T> = { success?: boolean; data?: T; error?: { message?: string } };

function lines(value: string) {
  return value
    .split("\n")
    .map((item) => item.replace(/^\s*[-*]\s+/, "").trim())
    .filter(Boolean);
}

async function readApi<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok) throw new Error(payload?.error?.message || "The change could not be saved.");
  if (!payload?.data) throw new Error("The server returned an incomplete response.");
  return payload.data;
}

export function AdminRetreatExperienceEditor({
  initialData,
}: {
  initialData: RetreatExperienceEditorData;
}) {
  const [experience, setExperience] = useState(initialData);
  const [content, setContent] = useState(initialData.draftContent);
  const [slug, setSlug] = useState(initialData.slug);
  const [listText, setListText] = useState({
    suitableFor: initialData.draftContent.suitableFor.join("\n"),
    included: initialData.draftContent.included.join("\n"),
    notIncluded: initialData.draftContent.notIncluded.join("\n"),
    whatToBring: initialData.draftContent.whatToBring.join("\n"),
  });
  const [busy, setBusy] = useState<"" | "save" | "publish">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isResidential = experience.eventKind === "residential_retreat";

  const submittedContent = useMemo(
    () => ({
      ...content,
      suitableFor: lines(listText.suitableFor),
      included: lines(listText.included),
      notIncluded: lines(listText.notIncluded),
      whatToBring: lines(listText.whatToBring),
      image: content.image?.url.trim() ? content.image : undefined,
    }),
    [content, listText]
  );

  async function save(showMessage = true) {
    if (content.image?.url.trim() && !content.image.alt.trim()) {
      setError("Add alternative text for the event image before saving.");
      return null;
    }
    setBusy("save");
    setError("");
    setMessage("");
    try {
      const updated = await readApi<RetreatExperienceEditorData>(
        await fetch(`/api/admin/retreats/experiences/${experience.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revision: experience.revision, slug, content: submittedContent }),
        })
      );
      setExperience(updated);
      setContent(updated.draftContent);
      setSlug(updated.slug);
      if (showMessage) setMessage("Draft saved. The public page has not changed yet.");
      return updated;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the draft.");
      return null;
    } finally {
      setBusy("");
    }
  }

  async function publish() {
    setBusy("publish");
    setError("");
    setMessage("");
    try {
      const saved = await save(false);
      if (!saved) return;
      setBusy("publish");
      const published = await readApi<RetreatExperienceEditorData>(
        await fetch(`/api/admin/retreats/experiences/${experience.id}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revision: saved.revision }),
        })
      );
      setExperience(published);
      setMessage("Event page published.");
    } catch (publishError) {
      setError(
        publishError instanceof Error ? publishError.message : "Unable to publish the page."
      );
    } finally {
      setBusy("");
    }
  }

  const update = <K extends keyof ExperienceContent>(key: K, value: ExperienceContent[K]) =>
    setContent((current) => ({ ...current, [key]: value }));

  const dirty =
    slug !== experience.slug ||
    JSON.stringify(submittedContent) !== JSON.stringify(experience.draftContent);
  function discard() {
    setContent(experience.draftContent);
    setSlug(experience.slug);
    setListText({
      suitableFor: experience.draftContent.suitableFor.join("\n"),
      included: experience.draftContent.included.join("\n"),
      notIncluded: experience.draftContent.notIncluded.join("\n"),
      whatToBring: experience.draftContent.whatToBring.join("\n"),
    });
    setError("");
    setMessage("");
  }

  return (
    <AdminLayout title={`${experience.title} - Event page`}>
      <div className="space-y-6">
        <AppPageHeader
          eyebrow="Event page"
          title={experience.title || "Untitled event page"}
          description="Public copy and photography are shared by every date using this theme. Booking settings are managed on each dated event."
          meta={
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={experience.publishedAt ? "default" : "secondary"}>
                {experience.publishedAt ? "Published" : "Draft"}
              </Badge>
              {experience.hasUnpublishedChanges && experience.publishedAt ? (
                <Badge variant="outline">Unpublished changes</Badge>
              ) : null}
              {experience.sourceContentfulEntryId ? <span>Imported from Contentful</span> : null}
            </div>
          }
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/admin/retreats/experiences">All event pages</Link>
              </Button>
              {experience.publishedAt ? (
                <Button asChild variant="outline">
                  <Link href={`/retreats/${experience.slug}`} target="_blank">
                    View page <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
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

        <fieldset disabled={busy !== ""} aria-label="Event page content" className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Card and introduction</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div>
                  <Label htmlFor="experience-title">Title</Label>
                  <Input
                    id="experience-title"
                    value={content.title}
                    onChange={(event) => update("title", event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="experience-slug">Public address</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">/retreats/</span>
                    <Input
                      id="experience-slug"
                      value={slug}
                      disabled={Boolean(experience.publishedAt)}
                      onChange={(event) => setSlug(event.target.value)}
                    />
                  </div>
                  {experience.publishedAt ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Locked after first publication so existing links keep working.
                    </p>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="experience-subtitle">Short introduction</Label>
                  <Textarea
                    id="experience-subtitle"
                    rows={2}
                    value={content.subtitle}
                    onChange={(event) => update("subtitle", event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="experience-summary">Card summary</Label>
                  <Textarea
                    id="experience-summary"
                    rows={3}
                    value={content.shortDescription}
                    onChange={(event) => update("shortDescription", event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="experience-duration">Duration label</Label>
                  <Input
                    id="experience-duration"
                    value={content.durationLabel}
                    placeholder="3 days / 2 nights"
                    onChange={(event) => update("durationLabel", event.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Story and schedule</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div>
                  <Label htmlFor="experience-description">Full description</Label>
                  <Textarea
                    id="experience-description"
                    rows={9}
                    value={content.fullDescription}
                    onChange={(event) => update("fullDescription", event.target.value)}
                  />
                  <p className="text-muted-foreground mt-1 text-xs">
                    Markdown headings, emphasis, links and lists are supported.
                  </p>
                </div>
                <div>
                  <Label htmlFor="experience-atmosphere">Atmosphere</Label>
                  <Textarea
                    id="experience-atmosphere"
                    rows={4}
                    value={content.atmosphereDescription}
                    onChange={(event) => update("atmosphereDescription", event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="experience-schedule">Schedule</Label>
                  <Textarea
                    id="experience-schedule"
                    rows={12}
                    value={content.scheduleMarkdown}
                    onChange={(event) => update("scheduleMarkdown", event.target.value)}
                  />
                  <p className="text-muted-foreground mt-1 text-xs">
                    Keep the whole schedule in this one Markdown textbox; no nested day records are
                    needed.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Who it is for and what is included</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="experience-audience">Audience summary</Label>
                  <Textarea
                    id="experience-audience"
                    rows={3}
                    value={content.audienceDescription}
                    onChange={(event) => update("audienceDescription", event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="experience-level">Experience level</Label>
                  <Input
                    id="experience-level"
                    value={content.experienceLevel}
                    onChange={(event) => update("experienceLevel", event.target.value)}
                  />
                </div>
                {(["suitableFor", "included", "notIncluded", "whatToBring"] as const).map((key) => (
                  <div key={key}>
                    <Label htmlFor={`experience-${key}`}>
                      {key === "suitableFor"
                        ? "Suitable for"
                        : key === "notIncluded"
                          ? "Not included"
                          : key === "whatToBring"
                            ? "What to bring"
                            : "Included"}{" "}
                      · one per line
                    </Label>
                    <Textarea
                      id={`experience-${key}`}
                      rows={6}
                      value={listText[key]}
                      onChange={(event) =>
                        setListText((current) => ({ ...current, [key]: event.target.value }))
                      }
                    />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <Label htmlFor="experience-food">Food and drink</Label>
                  <Textarea
                    id="experience-food"
                    rows={4}
                    value={content.foodAndDrinkDescription}
                    onChange={(event) => update("foodAndDrinkDescription", event.target.value)}
                  />
                </div>
                {isResidential ? (
                  <div className="md:col-span-2">
                    <Label htmlFor="experience-stay">Stay overview</Label>
                    <Textarea
                      id="experience-stay"
                      rows={4}
                      value={content.accommodationDescription}
                      onChange={(event) => update("accommodationDescription", event.target.value)}
                    />
                    <p className="text-muted-foreground mt-1 text-xs">
                      Keep individual rooms, bed layouts, stock and prices in Venue rooms and the
                      dated event.
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Photography</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5">
                <RetreatImageField
                  id="experience-image"
                  value={content.image}
                  disabled={busy !== ""}
                  onChange={(image) => update("image", image)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Search preview</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div>
                  <Label htmlFor="experience-seo-title">SEO title</Label>
                  <Input
                    id="experience-seo-title"
                    value={content.seoTitle}
                    onChange={(event) => update("seoTitle", event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="experience-seo-description">SEO description</Label>
                  <Textarea
                    id="experience-seo-description"
                    rows={3}
                    value={content.seoDescription}
                    onChange={(event) => update("seoDescription", event.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={busy !== ""}
                  onClick={() => void save()}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {busy === "save" ? "Saving…" : "Save draft"}
                </Button>
                <Button className="w-full" disabled={busy !== ""} onClick={() => void publish()}>
                  <Send className="mr-2 h-4 w-4" />
                  {busy === "publish"
                    ? "Publishing…"
                    : experience.publishedAt
                      ? "Publish changes"
                      : "Publish page"}
                </Button>
                <p className="text-muted-foreground text-xs">
                  Publishing copy never opens a dated event for booking.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Markdown preview</CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownContent className="text-muted-foreground text-sm leading-relaxed">
                  {content.scheduleMarkdown || "Add a schedule to preview it here."}
                </MarkdownContent>
              </CardContent>
            </Card>
          </aside>
        </fieldset>
        <AdminFormActions
          dirty={dirty}
          busy={busy !== ""}
          onSave={() => void save()}
          onDiscard={discard}
          label="Save draft"
        />
      </div>
    </AdminLayout>
  );
}
