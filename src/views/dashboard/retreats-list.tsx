"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, CheckCircle2, Gift, MapPin, Mountain } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { RetreatsListPageSkeleton } from "@/components/dashboard-skeleton";
import { LoadingRegion } from "@/components/loading-region";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RetreatBookingSummaryDto, RetreatGiftPurchaseSummaryDto } from "@/lib/api/types";

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
  initialGifts,
}: {
  initialData?: RetreatBookingSummaryDto[] | null;
  initialGifts?: RetreatGiftPurchaseSummaryDto[] | null;
}) {
  const [bookings, setBookings] = useState<RetreatBookingSummaryDto[]>(initialData || []);
  const [gifts, setGifts] = useState<RetreatGiftPurchaseSummaryDto[]>(initialGifts || []);
  const [loading, setLoading] = useState(!initialData || !initialGifts);
  const [error, setError] = useState("");
  const [cancellingGiftId, setCancellingGiftId] = useState("");

  const requestGiftCancellation = async (gift: RetreatGiftPurchaseSummaryDto) => {
    const reason = window.prompt(
      "Why would you like to cancel this gift? The gift remains reserved until Shruti reviews the request.",
      ""
    );
    if (reason === null) return;
    setCancellingGiftId(gift.id);
    setError("");
    try {
      const response = await fetch(`/api/me/retreat-gifts/${gift.id}/cancellation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) throw new Error(payload?.message || "Unable to request cancellation.");
      const refreshed = await fetch("/api/me/retreat-gifts", { cache: "no-store" });
      if (refreshed.ok) {
        const next = (await refreshed.json()) as { data: RetreatGiftPurchaseSummaryDto[] };
        setGifts(next.data);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Unable to request cancellation."
      );
    } finally {
      setCancellingGiftId("");
    }
  };

  useEffect(() => {
    if (initialData && initialGifts) return;
    let active = true;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const [bookingResponse, giftResponse] = await Promise.all([
          fetch("/api/me/retreats", { cache: "no-store" }),
          fetch("/api/me/retreat-gifts", { cache: "no-store" }),
        ]);
        if (!bookingResponse.ok || !giftResponse.ok) throw new Error("Failed to load retreats.");
        const bookingPayload = (await bookingResponse.json()) as {
          success: true;
          data: RetreatBookingSummaryDto[];
        };
        const giftPayload = (await giftResponse.json()) as {
          success: true;
          data: RetreatGiftPurchaseSummaryDto[];
        };
        if (active) {
          setBookings(bookingPayload.data);
          setGifts(giftPayload.data);
        }
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
  }, [initialData, initialGifts]);

  if (loading) {
    return (
      <DashboardLayout title="Retreats - Private Studio">
        <LoadingRegion label="Loading your retreats">
          <RetreatsListPageSkeleton />
        </LoadingRegion>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Retreats - Private Studio">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl">Your Retreats</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            View booking status, balance payments and the essentials for any retreat you have booked
            through the studio.
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

        {gifts.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl">Retreat gifts you purchased</h2>
              <Badge variant="outline">{gifts.length}</Badge>
            </div>
            <div className="space-y-4">
              {gifts.map((gift) => (
                <Card key={gift.id}>
                  <CardContent className="flex flex-col gap-4 py-6 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Gift className="text-brand-accent h-5 w-5" aria-hidden="true" />
                        <Badge variant={gift.status === "refunded" ? "destructive" : "outline"}>
                          {gift.status.replaceAll("_", " ")}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="text-xl">{gift.retreatTitle}</h3>
                        <p className="text-muted-foreground mt-1 text-sm">
                          For {gift.recipientName} ({gift.recipientEmail})
                        </p>
                        <div className="text-muted-foreground mt-2 flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" aria-hidden="true" />
                            {gift.location}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" aria-hidden="true" />
                            {formatDateRange(gift.startsAt, gift.endsAt)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm">
                        {gift.roomType || "Retreat place"} · {gift.guestCount}{" "}
                        {gift.guestCount === 1 ? "guest" : "guests"} ·{" "}
                        {formatCurrency(gift.totalPaidPence - gift.refundedAmountPence)} paid
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {gift.status === "redeemed"
                          ? "The recipient has claimed this gift."
                          : gift.status === "refunded"
                            ? "This gift has been cancelled and its policy-based refund submitted."
                            : gift.deliveredAt
                              ? "The gift email has been sent and is waiting to be claimed."
                              : "Payment is complete and delivery is being prepared."}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 md:min-w-48">
                      {gift.cancellation ? (
                        <p
                          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
                          role="status"
                        >
                          Cancellation {gift.cancellation.status.replaceAll("_", " ")} · estimated
                          refund {formatCurrency(gift.cancellation.refundableAmountPence)}
                        </p>
                      ) : null}
                      {gift.canRequestCancellation ? (
                        <Button
                          variant="outline"
                          disabled={cancellingGiftId === gift.id}
                          onClick={() => void requestGiftCancellation(gift)}
                        >
                          {cancellingGiftId === gift.id ? "Sending…" : "Request cancellation"}
                        </Button>
                      ) : null}
                      <Button asChild variant="outline">
                        <Link href={`/retreats/${gift.retreatSlug}`}>
                          Retreat details
                          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-xl">Explore upcoming retreats</h2>
          <Card>
            <CardContent className="flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg">See current retreat dates</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Retreat availability is managed from the live retreat listings rather than local
                  dashboard copy.
                </p>
              </div>
              <Button asChild>
                <Link href="/retreats">
                  View retreats
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
}
