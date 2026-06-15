"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, CheckCircle2, MapPin, Mountain } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RetreatBookingSummaryDto } from "@/lib/api/types";
import { getUpcomingRetreats } from "@/data/retreat-data";

function formatDateRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}

function formatCurrency(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

function paymentBadge(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "paid_in_full") return "default";
  if (status === "deposit_paid" || status === "balance_due") return "secondary";
  if (status === "cancelled") return "destructive";
  return "outline";
}

export function DashboardRetreats({
  initialData,
}: {
  initialData?: RetreatBookingSummaryDto[] | null;
}) {
  const [bookings, setBookings] = useState<RetreatBookingSummaryDto[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) return;
    let active = true;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/me/retreats", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load retreats.");
        const payload = (await response.json()) as RetreatBookingSummaryDto[];
        if (active) setBookings(payload);
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

  const upcomingRetreats = useMemo(
    () =>
      getUpcomingRetreats().filter(
        (retreat) => !bookings.some((booking) => booking.retreatSlug === retreat.slug)
      ),
    [bookings]
  );

  if (loading) {
    return (
      <DashboardLayout title="Retreats - Private Studio">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Retreats - Private Studio">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl">Your Retreats</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            View booking status, balance payments and the essentials for any retreat you have
            booked through the studio.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Booked retreats</h2>
            <Badge variant="outline">{bookings.length}</Badge>
          </div>

          {bookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mountain className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
                <p className="text-muted-foreground">
                  You do not have any retreat bookings linked to your account yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="border-brand-accent/20">
                  <CardContent className="flex flex-col gap-4 py-6 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={paymentBadge(booking.paymentStatus)}>
                          {booking.paymentStatus.replaceAll("_", " ")}
                        </Badge>
                        <Badge variant="outline">
                          {booking.bookingStatus.replaceAll("_", " ")}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="text-xl">{booking.retreatTitle}</h3>
                        <div className="text-muted-foreground mt-2 flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            {booking.location}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {formatDateRange(booking.startsAt, booking.endsAt)}
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-muted-foreground text-xs tracking-wide uppercase">
                            Total
                          </p>
                          <p className="mt-1">{formatCurrency(booking.totalPricePence)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs tracking-wide uppercase">
                            Deposit paid
                          </p>
                          <p className="mt-1">{formatCurrency(booking.depositPaidPence)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs tracking-wide uppercase">
                            Balance remaining
                          </p>
                          <p className="mt-1">{formatCurrency(booking.balanceAmountPence)}</p>
                        </div>
                      </div>

                      {booking.canPayBalance ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                          Balance due
                          {booking.balanceDueAt
                            ? ` by ${new Intl.DateTimeFormat("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }).format(new Date(booking.balanceDueAt))}`
                            : ""}
                          .
                        </div>
                      ) : (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                          <CheckCircle2 className="mr-2 inline h-4 w-4" />
                          No balance action needed.
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 md:min-w-52">
                      <Button asChild className="w-full">
                        <Link href={`/dashboard/retreats/${booking.id}`}>
                          View booking
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/retreats/${booking.retreatSlug}`}>
                          Public retreat page
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl">Explore upcoming retreats</h2>
          {upcomingRetreats.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No upcoming retreats are open right now.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingRetreats.map((retreat) => (
                <Card key={retreat.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{retreat.title}</CardTitle>
                    <p className="text-muted-foreground text-sm">{retreat.subtitle}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      {retreat.location}
                    </div>
                    {retreat.dates[0] ? (
                      <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        {formatDateRange(retreat.dates[0].startDate, retreat.dates[0].endDate)}
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <p className="text-lg">{formatCurrency(retreat.earlyBirdPrice * 100)}</p>
                        <p className="text-muted-foreground text-xs">Current from price</p>
                      </div>
                      <Button asChild variant="outline">
                        <Link href={`/retreats/${retreat.slug}`}>
                          View retreat
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
