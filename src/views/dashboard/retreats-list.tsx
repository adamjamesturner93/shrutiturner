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
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
  registrations = [],
  registrationLoadFailed = false,
}: {
  initialData?: RetreatBookingSummaryDto[] | null;
  initialGifts?: RetreatGiftPurchaseSummaryDto[] | null;
  registrations?: Array<{ id: string; bookingId?: string; title: string; complete: boolean; startsAt: string }>;
  registrationLoadFailed?: boolean;
}) {
  const [bookings, setBookings] = useState<RetreatBookingSummaryDto[]>(initialData || []);
  const [gifts, setGifts] = useState<RetreatGiftPurchaseSummaryDto[]>(initialGifts || []);
  const [loading, setLoading] = useState(!initialData || !initialGifts);
  const [error, setError] = useState("");
  const [cancellingGiftId, setCancellingGiftId] = useState("");
  const [giftToCancel, setGiftToCancel] = useState<RetreatGiftPurchaseSummaryDto | null>(null);
  const [giftReason, setGiftReason] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [bookingLoadError, setBookingLoadError] = useState("");
  const [giftLoadError, setGiftLoadError] = useState("");
  const separateRegistrations = registrations.filter((registration) =>
    !bookings.some((booking) => booking.id === registration.bookingId && booking.registrations?.length));

  const requestGiftCancellation = async (gift: RetreatGiftPurchaseSummaryDto) => {
    const reason = giftReason;
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
      setGiftToCancel(null);
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
    if (initialData && initialGifts && !reloadKey) return;
    let active = true;
    void (async () => {
      setLoading(true);
      setError("");
      setBookingLoadError("");
      setGiftLoadError("");
      try {
        await Promise.all([
          (async () => {
            try {
              const response = await fetch("/api/me/retreats", { cache: "no-store" });
              if (!response.ok) throw new Error();
              const payload = await response.json();
              if (active) setBookings(payload.data);
            } catch {
              if (active)
                setBookingLoadError(
                  "Your bookings could not be loaded. Gifts are still available."
                );
            }
          })(),
          (async () => {
            try {
              const response = await fetch("/api/me/retreat-gifts", { cache: "no-store" });
              if (!response.ok) throw new Error();
              const payload = await response.json();
              if (active) setGifts(payload.data);
            } catch {
              if (active)
                setGiftLoadError(
                  "Your gifts could not be loaded. Your bookings are still available."
                );
            }
          })(),
        ]);
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
  }, [initialData, initialGifts, reloadKey]);

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
          <h1 className="text-3xl">Your retreats & workshops</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Your bookings, guest registrations and joining information.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {bookingLoadError || giftLoadError ? (
          <div role="alert" className="rounded-lg border p-3">
            {bookingLoadError && <p>{bookingLoadError}</p>}
            {giftLoadError && <p>{giftLoadError}</p>}
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => setReloadKey((value) => value + 1)}
            >
              Try again
            </Button>
          </div>
        ) : null}
        <Dialog
          open={Boolean(giftToCancel)}
          onOpenChange={(open) => {
            if (!open && !cancellingGiftId) setGiftToCancel(null);
          }}
        >
          <DialogContent>
            <DialogTitle>Request gift cancellation</DialogTitle>
            <DialogDescription>
              {giftToCancel?.retreatTitle} —{" "}
              {giftToCancel ? formatDateRange(giftToCancel.startsAt, giftToCancel.endsAt) : ""}. The
              gift stays reserved until Shruti reviews your request. Any refund is confirmed
              separately.
            </DialogDescription>
            <label className="space-y-2">
              <span>Reason (optional)</span>
              <Textarea
                value={giftReason}
                onChange={(event) => setGiftReason(event.target.value)}
                maxLength={2000}
              />
            </label>
            {error && <p role="alert">{error}</p>}
            <Button
              disabled={Boolean(cancellingGiftId)}
              onClick={() => giftToCancel && void requestGiftCancellation(giftToCancel)}
            >
              {cancellingGiftId ? "Sending request…" : "Send request"}
            </Button>
          </DialogContent>
        </Dialog>

        {registrationLoadFailed && <p role="alert">Registration status could not be loaded. Open your booking to check details or reload this page.</p>}
        {separateRegistrations.length ? (
          <section className="space-y-4" aria-labelledby="my-registrations">
            <h2 id="my-registrations" className="text-xl">
              My registrations
            </h2>
            {separateRegistrations.map((registration) => (
              <Card key={registration.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
                  <div>
                    <h3 className="font-medium">{registration.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {registration.complete ? "Registration complete" : "Registration needed"}
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link href={`/dashboard/retreats/registration/${registration.id}`}>
                      My registration
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </section>
        ) : null}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Bookings I manage</h2>
            <Badge variant="outline">{bookings.length}</Badge>
          </div>

          {bookingLoadError && bookings.length === 0 ? null : bookings.length === 0 ? (
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

                      {booking.registrations?.length ? <div className="space-y-2">
                        <p className="text-sm font-medium">{booking.registrations.length} {booking.registrations.length === 1 ? "guest" : "guests"} · booked together</p>
                        {booking.registrations.map((registration) => <div key={registration.id} className="flex flex-wrap items-center gap-2 text-sm">
                          <span>{registration.name}{registration.isOwn ? " (you)" : ""}</span>
                          <Badge variant={registration.complete ? "secondary" : "outline"}>{registration.complete ? "Registration complete" : "Registration needed"}</Badge>
                          {registration.isOwn && <Link className="text-primary underline" href={`/dashboard/retreats/registration/${registration.id}`}>{registration.complete ? "Review details" : "Complete registration"}</Link>}
                        </div>)}
                      </div> : null}
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
                        <Link
                          href={`/retreats/${booking.retreatSlug}${booking.retreatDateId ? `?date=${encodeURIComponent(booking.retreatDateId)}` : ""}`}
                        >
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
                          onClick={() => {
                            setGiftReason("");
                            setError("");
                            setGiftToCancel(gift);
                          }}
                        >
                          {cancellingGiftId === gift.id ? "Sending…" : "Request cancellation"}
                        </Button>
                      ) : null}
                      <Button asChild variant="outline">
                        <Link
                          href={`/retreats/${gift.retreatSlug}${gift.retreatDateId ? `?date=${encodeURIComponent(gift.retreatDateId)}` : ""}`}
                        >
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
