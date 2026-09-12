"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminSection } from "@/components/admin/use-admin-section";
import Link from "next/link";
import {
  Calendar,
  FileText,
  LayoutTemplate,
  BedDouble,
  ChevronRight,
  MapPin,
  Mountain,
  Plus,
  PoundSterling,
  Users,
  Video,
} from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InlineLoadingStatus } from "@/components/loading-region";
import type { AdminRetreatSummaryDto } from "@/lib/api/types";
import { formatRetreatDateTimeRange } from "@/lib/retreats/presentation";

function formatCurrency(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "open") return "default";
  if (status === "sold_out") return "destructive";
  if (status === "completed") return "outline";
  return "secondary";
}

const EVENT_KIND_LABELS: Record<AdminRetreatSummaryDto["eventKind"], string> = {
  residential_retreat: "Residential retreat",
  day_retreat: "Day retreat",
  in_person_workshop: "In-person workshop",
  online_workshop: "Online workshop",
};

export function AdminRetreats({ initialData }: { initialData?: AdminRetreatSummaryDto[] | null }) {
  const [retreats, setRetreats] = useState<AdminRetreatSummaryDto[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [lifecycle, setLifecycle] = useAdminSection(
    "lifecycle",
    ["current", "draft", "past", "all"] as const,
    "current"
  );
  const visibleRetreats = retreats.filter((retreat) => {
    const archived =
      ["completed", "cancelled"].includes(retreat.status) || new Date(retreat.endDate) < new Date();
    if (lifecycle === "current" && (archived || retreat.status === "draft")) return false;
    if (lifecycle === "draft" && retreat.status !== "draft") return false;
    if (lifecycle === "past" && !archived) return false;
    return `${retreat.title} ${retreat.location}`.toLowerCase().includes(search.toLowerCase());
  });

  useEffect(() => {
    if (initialData) return;
    let active = true;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/admin/retreats", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load retreats.");
        const payload = (await response.json()) as AdminRetreatSummaryDto[];
        if (active) setRetreats(payload);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load retreats.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [initialData]);

  const summary = useMemo(() => {
    const totalRevenuePence = retreats.reduce((sum, retreat) => sum + retreat.revenuePence, 0);
    const totalBooked = retreats.reduce((sum, retreat) => sum + retreat.bookedSpaces, 0);
    return {
      totalRevenuePence,
      totalBooked,
    };
  }, [retreats]);

  return (
    <AdminLayout title="Retreats - Admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-brand-dark text-2xl">Retreats and Workshops</h1>
            <p className="text-muted-foreground mt-1">
              Live bookings, payment status and operational capacity across retreats and online
              workshops.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Manage setup</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/admin/retreats/experiences">
                    <FileText aria-hidden="true" />
                    Event pages
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/retreats/formats">
                    <LayoutTemplate aria-hidden="true" />
                    Formats
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/retreats/venues">
                    <BedDouble className="mr-2 h-4 w-4" />
                    Venue rooms
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild>
              <Link href="/admin/retreats/new">
                <Plus className="mr-2 h-4 w-4" />
                Create event
              </Link>
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <p className="text-muted-foreground text-sm">
          Totals across all event dates, including past events. Filters below only change the event
          list.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Mountain className="text-brand-accent h-5 w-5" />
                <div>
                  <p className="text-brand-dark text-2xl">{retreats.length}</p>
                  <p className="text-muted-foreground text-xs">Retreat/workshop dates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="text-brand-accent h-5 w-5" />
                <div>
                  <p className="text-brand-dark text-2xl">{summary.totalBooked}</p>
                  <p className="text-muted-foreground text-xs">Confirmed places</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <PoundSterling className="text-brand-accent h-5 w-5" />
                <div>
                  <p className="text-brand-dark text-2xl">
                    {formatCurrency(summary.totalRevenuePence)}
                  </p>
                  <p className="text-muted-foreground text-xs">Captured revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? <InlineLoadingStatus label="Loading retreats…" /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="retreat-search">Search events</Label>
            <Input
              id="retreat-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="retreat-lifecycle">Show events</Label>
            <select
              id="retreat-lifecycle"
              className="bg-background h-11 w-full rounded-md border px-3"
              value={lifecycle}
              onChange={(event) => setLifecycle(event.target.value)}
            >
              <option value="current">Upcoming and live</option>
              <option value="draft">Drafts</option>
              <option value="past">Past and cancelled</option>
              <option value="all">All events</option>
            </select>
          </div>
        </div>
        {!loading && !error && !visibleRetreats.length ? (
          <div>
            <p>No events match these filters.</p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => {
                setSearch("");
                setLifecycle("all");
              }}
            >
              Show all events
            </Button>
          </div>
        ) : null}

        <div className="space-y-4">
          {visibleRetreats.map((retreat) => {
            const fillPercent =
              retreat.totalSpaces > 0
                ? Math.round((retreat.bookedSpaces / retreat.totalSpaces) * 100)
                : 0;
            const Icon = retreat.eventKind === "online_workshop" ? Video : Mountain;

            return (
              <Link className="block" key={retreat.id} href={`/admin/retreats/${retreat.id}`}>
                <Card className="hover:border-brand-accent/30 transition-colors">
                  <CardContent className="py-5">
                    <div className="flex items-start gap-4">
                      <div className="bg-brand-accent/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg">
                        <Icon className="text-brand-accent h-6 w-6" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base">{retreat.title}</p>
                          <Badge variant="outline">{EVENT_KIND_LABELS[retreat.eventKind]}</Badge>
                          <Badge variant={statusVariant(retreat.status)}>
                            {retreat.status.replaceAll("_", " ")}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {retreat.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatRetreatDateTimeRange(
                              retreat.startDate,
                              retreat.endDate,
                              retreat.timezone
                            )}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="w-full max-w-xs">
                            <div className="mb-1 flex justify-between text-xs">
                              <span>
                                {retreat.bookedSpaces}/{retreat.totalSpaces} booked
                              </span>
                              <span className="text-muted-foreground">{fillPercent}%</span>
                            </div>
                            <div className="bg-secondary h-2 overflow-hidden rounded-full">
                              <div
                                className="bg-brand-accent h-full rounded-full"
                                style={{ width: `${fillPercent}%` }}
                              />
                            </div>
                          </div>

                          <div className="text-sm">
                            <p>{formatCurrency(retreat.revenuePence)} captured</p>
                            <p className="text-muted-foreground">
                              {retreat.priceVaries ? "From " : ""}
                              {formatCurrency(
                                retreat.currentPricePence ?? retreat.normalPricePence
                              )}
                              {(retreat.currentPricePence ?? retreat.normalPricePence) <
                              retreat.normalPricePence
                                ? " · Early bird"
                                : ""}
                            </p>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="text-muted-foreground mt-1 h-4 w-4 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {!loading && retreats.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No retreat dates are synced yet.</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AdminLayout>
  );
}
