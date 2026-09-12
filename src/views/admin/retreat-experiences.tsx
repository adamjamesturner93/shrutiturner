"use client";

import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { AppEmptyState, AppPageHeader } from "@/components/app-surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type EventKind = "residential_retreat" | "day_retreat" | "in_person_workshop" | "online_workshop";

type ExperienceSummary = {
  id: string;
  slug: string;
  title: string;
  eventKind: EventKind;
  publishedAt: string | null;
  sourceContentfulEntryId: string | null;
  hasUnpublishedChanges: boolean;
  updatedAt: string;
};

const LABELS: Record<EventKind, string> = {
  residential_retreat: "Residential retreat",
  day_retreat: "Day retreat",
  in_person_workshop: "In-person workshop",
  online_workshop: "Online workshop",
};

export function AdminRetreatExperiences({ experiences }: { experiences: ExperienceSummary[] }) {
  return (
    <AdminLayout title="Event pages - Admin">
      <div className="space-y-6">
        <AppPageHeader
          eyebrow="Retreats and workshops"
          title="Event pages"
          description="Edit each reusable public story once, then add as many dated events as you need. Dates, capacity, prices and attendees stay separate."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/admin/retreats">Back to events</Link>
              </Button>
              <Button asChild>
                <Link href="/admin/retreats/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create event
                </Link>
              </Button>
            </div>
          }
        />

        {experiences.length === 0 ? (
          <AppEmptyState
            title="No app-managed event pages yet"
            description="Create an event to start from a saved format. Existing Contentful pages continue to work until they are imported."
            action={
              <Button asChild>
                <Link href="/admin/retreats/new">Create your first event</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {experiences.map((experience) => (
              <Link key={experience.id} href={`/admin/retreats/experiences/${experience.id}`}>
                <Card className="hover:border-brand-accent/40 h-full transition-colors">
                  <CardContent className="flex h-full items-start gap-4 pt-6">
                    <div className="bg-brand-accent/10 rounded-lg p-3">
                      <FileText className="text-brand-accent h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg">{experience.title || "Untitled event page"}</h2>
                        <Badge variant={experience.publishedAt ? "default" : "secondary"}>
                          {experience.publishedAt ? "Published" : "Draft"}
                        </Badge>
                        {experience.hasUnpublishedChanges && experience.publishedAt ? (
                          <Badge variant="outline">Changes to publish</Badge>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground mt-2 text-sm">
                        {LABELS[experience.eventKind]} · /retreats/{experience.slug}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Updated {new Date(experience.updatedAt).toLocaleString("en-GB")}
                        {experience.sourceContentfulEntryId ? " · imported from Contentful" : ""}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
