"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
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
import {
  CreateRetreatModal,
  type CreateRetreatData,
} from "@/components/admin/create-retreat-modal";
import type { AdminRetreatSummaryDto } from "@/lib/api/types";

function formatCurrency(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

function formatDateRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "open") return "default";
  if (status === "sold_out") return "destructive";
  if (status === "completed") return "outline";
  return "secondary";
}

export function AdminRetreats({ initialData }: { initialData?: AdminRetreatSummaryDto[] | null }) {
  const [retreats, setRetreats] = useState<AdminRetreatSummaryDto[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

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

  async function reloadRetreats() {
    const response = await fetch("/api/admin/retreats", { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to load retreats.");
    const payload = (await response.json()) as AdminRetreatSummaryDto[];
    setRetreats(payload);
  }

  async function handleCreate(data: CreateRetreatData) {
    setError("");
    const response = await fetch("/api/admin/retreats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(payload?.message || "Failed to create retreat or workshop date.");
    }
    await reloadRetreats();
  }

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
          <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create date
          </Button>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

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

        {loading ? <p className="text-muted-foreground text-sm">Loading retreats...</p> : null}

        <div className="space-y-4">
          {retreats.map((retreat) => {
            const fillPercent =
              retreat.totalSpaces > 0
                ? Math.round((retreat.bookedSpaces / retreat.totalSpaces) * 100)
                : 0;
            const Icon = retreat.retreatType === "online" ? Video : Mountain;

            return (
              <Link key={retreat.id} href={`/admin/retreats/${retreat.id}`}>
                <Card className="hover:border-brand-accent/30 transition-colors">
                  <CardContent className="py-5">
                    <div className="flex items-start gap-4">
                      <div className="bg-brand-accent/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg">
                        <Icon className="text-brand-accent h-6 w-6" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base">{retreat.title}</p>
                          <Badge variant="outline">
                            {retreat.retreatType === "online" ? "online workshop" : "in-person"}
                          </Badge>
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
                            {formatDateRange(retreat.startDate, retreat.endDate)}
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
                              From {formatCurrency(retreat.earlyBirdPricePence)} /{" "}
                              {formatCurrency(retreat.normalPricePence)}
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
        <CreateRetreatModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreate={handleCreate}
        />
      </div>
    </AdminLayout>
  );
}
