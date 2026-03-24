"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { DashboardSkeleton } from "../../components/dashboard-skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertCircle, ArrowRight } from "lucide-react";
import type { AdminDashboardSummaryDto } from "@/lib/api/types";
import { AppMetricCard, AppMetricGrid, AppPageHeader } from "@/components/app-surface";

export function AdminDashboard({ initialData }: { initialData?: AdminDashboardSummaryDto | null }) {
  const [summary, setSummary] = useState<AdminDashboardSummaryDto | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) return;
    let active = true;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load admin dashboard.");
        const payload = (await res.json()) as AdminDashboardSummaryDto;
        if (active) setSummary(payload);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load admin dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [initialData]);

  if (loading) {
    return (
      <AdminLayout title="Dashboard - Admin">
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  if (!summary) {
    return (
      <AdminLayout title="Dashboard - Admin">
        <div className="py-16 text-center">
          <p className="text-muted-foreground">{error || "No admin dashboard data available."}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard - Admin">
      <div className="space-y-6">
        <AppPageHeader
          eyebrow="Admin overview"
          title="Instructor Dashboard"
          description={new Date(summary.today.date).toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        />

        <AppMetricGrid>
          <AppMetricCard
            label="Today's classes"
            value={summary.today.sessions}
            detail="scheduled sessions"
          />
          <AppMetricCard
            label="Booked / capacity"
            value={`${summary.today.booked}/${summary.today.capacity}`}
            detail="current occupancy"
          />
          <AppMetricCard
            label="Live now"
            value={summary.today.liveNow}
            detail="sessions in progress"
          />
          <AppMetricCard
            label="Upcoming"
            value={summary.upcoming.length}
            detail="next scheduled sessions"
          />
        </AppMetricGrid>

        {summary.nearFull.length > 0 ? (
          <Card className="border-brand-accent/20 bg-brand-accent/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="text-brand-accent h-4 w-4" />
                Near Capacity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {summary.nearFull.map((row) => (
                <Link
                  key={row.id}
                  href={`/admin/classes/${row.id}`}
                  className="hover:bg-brand-accent/5 flex items-center justify-between rounded-lg p-2.5 transition-colors"
                >
                  <p className="text-sm">
                    {row.title} -{" "}
                    {new Date(row.startsAtUtc).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <Badge variant={row.bookedCount >= row.capacity ? "destructive" : "secondary"}>
                    {row.bookedCount}/{row.capacity}
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Upcoming Classes</CardTitle>
              <Link href="/admin/classes">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary.upcoming.slice(0, 6).map((row) => (
                <Link
                  key={row.id}
                  href={`/admin/classes/${row.id}`}
                  className="bg-secondary/40 hover:bg-secondary flex items-center justify-between rounded-lg p-3 transition-colors"
                >
                  <div>
                    <p className="text-sm">{row.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(row.startsAtUtc).toLocaleString("en-GB", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {row.bookedCount}/{row.capacity}
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">7-Day Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="booked" fill="#4B5B32" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="attended" fill="#B5C49B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
