"use client";

import Link from "next/link";
import { Calendar, ChevronRight, Clock3, Plus, PoundSterling, Users } from "lucide-react";
import { AdminLayout } from "../../components/admin-layout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useEffect, useState } from "react";
import type { AdminSmallGroupSummary, SmallGroupTemplateOption } from "@/lib/small-groups/service";
import { AppMetricCard, AppMetricGrid, AppPageHeader } from "@/components/app-surface";

function statusVariant(status: AdminSmallGroupSummary["status"]) {
  if (status === "open" || status === "in_progress") return "default" as const;
  if (status === "completed") return "outline" as const;
  return "secondary" as const;
}

const WEEKDAY_OPTIONS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

export function AdminProgrammes({
  initialData,
  templateOptions,
}: {
  initialData: AdminSmallGroupSummary[];
  templateOptions: SmallGroupTemplateOption[];
}) {
  const [programmes, setProgrammes] = useState(initialData);
  const [templates, setTemplates] = useState(templateOptions);
  const defaultTemplate = templateOptions[0] || null;
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    templateSlug: defaultTemplate?.slug || "",
    startDate: "",
    timeLocal: "11:00",
    repeatWeeks: String(defaultTemplate?.durationWeeks || 6),
    cohortSize: String(defaultTemplate?.cohortSize || 6),
    pricePence: String(defaultTemplate?.defaultPricePence || 0),
    status: "upcoming",
    weekdays: defaultTemplate?.sessionsPerWeek === 2 ? [1, 3] : [1],
  });

  useEffect(() => {
    if (!defaultTemplate || form.templateSlug) return;
    setForm((current) => ({
      ...current,
      templateSlug: defaultTemplate.slug,
      repeatWeeks: String(defaultTemplate.durationWeeks || 6),
      cohortSize: String(defaultTemplate.cohortSize || 6),
      pricePence: String(defaultTemplate.defaultPricePence || 0),
      weekdays: defaultTemplate.sessionsPerWeek === 2 ? [1, 3] : [1],
    }));
  }, [defaultTemplate, form.templateSlug]);

  const selectedTemplate =
    templates.find((template) => template.slug === form.templateSlug) || defaultTemplate;

  const updateTemplate = (slug: string) => {
    const template = templates.find((item) => item.slug === slug);
    setForm((current) => ({
      ...current,
      templateSlug: slug,
      repeatWeeks: String(template?.durationWeeks || current.repeatWeeks || 6),
      cohortSize: String(template?.cohortSize || current.cohortSize || 6),
      pricePence: String(template?.defaultPricePence || current.pricePence || 0),
      weekdays: template?.sessionsPerWeek === 2 ? [1, 3] : [1],
    }));
  };

  const toggleWeekday = (value: number) => {
    setForm((current) => ({
      ...current,
      weekdays: current.weekdays.includes(value)
        ? current.weekdays.filter((day) => day !== value)
        : [...current.weekdays, value].sort((a, b) => a - b),
    }));
  };

  const handleCreateRun = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      const response = await fetch("/api/admin/programmes/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateSlug: form.templateSlug,
          startDate: form.startDate,
          timeLocal: form.timeLocal,
          repeatWeeks: Number(form.repeatWeeks || 0),
          cohortSize: Number(form.cohortSize || 0),
          pricePence: Number(form.pricePence || 0),
          status: form.status,
          weekdays: form.weekdays,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        item?: AdminSmallGroupSummary;
        templates?: SmallGroupTemplateOption[];
        message?: string;
      } | null;
      if (!response.ok || !payload?.item) {
        throw new Error(payload?.message || "Failed to create programme run.");
      }
      setProgrammes((current) =>
        [...current, payload.item!].sort(
          (a, b) =>
            (a.startDate || "").localeCompare(b.startDate || "") || a.title.localeCompare(b.title)
        )
      );
      if (payload.templates) {
        setTemplates(payload.templates);
      }
      setForm((current) => ({
        ...current,
        startDate: "",
      }));
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to create programme run.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminLayout title="Programmes - Admin">
      <div className="space-y-6">
        <AppPageHeader
          eyebrow="Programme operations"
          title="Small Group Programmes"
          description="Schedule live runs from Contentful templates, then manage enrolments and session progress for each cohort."
        />

        <AppMetricGrid className="lg:grid-cols-3">
          <AppMetricCard
            label="Total runs"
            value={programmes.length}
            detail="current and historical cohorts"
          />
          <AppMetricCard
            label="Open / in progress"
            value={
              programmes.filter(
                (programme) => programme.status === "open" || programme.status === "in_progress"
              ).length
            }
            detail="active cohorts needing attention"
          />
          <AppMetricCard
            label="Templates"
            value={templates.length}
            detail="available programme templates"
          />
        </AppMetricGrid>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleCreateRun} className="space-y-5">
              <div className="flex items-center gap-2">
                <Plus className="text-brand-accent h-4 w-4" />
                <h2 className="text-lg">Schedule a new run</h2>
              </div>
              {createError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {createError}
                </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="templateSlug">Template</Label>
                  <select
                    id="templateSlug"
                    value={form.templateSlug}
                    onChange={(event) => updateTemplate(event.target.value)}
                    className="border-border bg-background rounded-md border px-3 py-2 text-sm"
                  >
                    {templates.map((template) => (
                      <option key={template.slug} value={template.slug}>
                        {template.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">First session date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, startDate: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeLocal">Time</Label>
                  <Input
                    id="timeLocal"
                    type="time"
                    required
                    value={form.timeLocal}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, timeLocal: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, status: event.target.value }))
                    }
                    className="border-border bg-background rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="open">Open</option>
                    <option value="waitlist">Waitlist</option>
                    <option value="in_progress">In progress</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repeatWeeks">Duration (weeks)</Label>
                  <Input
                    id="repeatWeeks"
                    type="number"
                    min={1}
                    required
                    value={form.repeatWeeks}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, repeatWeeks: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cohortSize">Cohort size</Label>
                  <Input
                    id="cohortSize"
                    type="number"
                    min={1}
                    required
                    value={form.cohortSize}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, cohortSize: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePence">Price (pence)</Label>
                  <div className="relative">
                    <PoundSterling className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="pricePence"
                      type="number"
                      min={0}
                      required
                      value={form.pricePence}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, pricePence: event.target.value }))
                      }
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Weekdays</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAY_OPTIONS.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleWeekday(day.value)}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          form.weekdays.includes(day.value)
                            ? "bg-brand-accent text-white"
                            : "bg-background"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {selectedTemplate?.subtitle ? (
                <p className="text-muted-foreground text-sm">{selectedTemplate.subtitle}</p>
              ) : null}

              <Button type="submit" disabled={creating}>
                {creating ? "Scheduling..." : "Create programme run"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {programmes.map((programme) => (
            <Link key={programme.id} href={programme.runHref}>
              <Card className="hover:border-brand-accent/30 transition-colors">
                <CardContent className="py-5">
                  <div className="flex items-start gap-4">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base">{programme.title}</p>
                        <Badge variant={statusVariant(programme.status)}>
                          {programme.status.replaceAll("_", " ")}
                        </Badge>
                        <Badge variant="outline">{programme.runSlug}</Badge>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {programme.shortSummary}
                      </p>
                      <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {programme.durationLabel}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {programme.activeEnrolmentCount} active · {programme.enrolmentCount} total
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {programme.completedSessionCount}/{programme.sessionCount} sessions
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
