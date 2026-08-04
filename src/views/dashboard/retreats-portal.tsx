"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CreditCard,
  MapPin,
  MessageCircle,
  Shield,
  Video,
  XCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VideoRoom } from "@/components/video/video-room";
import type { RetreatBookingDetailDto } from "@/lib/api/types";

function formatDateRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatCurrency(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

function paymentVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "paid_in_full") return "default";
  if (status === "deposit_paid" || status === "balance_due") return "secondary";
  if (status === "cancelled") return "destructive";
  return "outline";
}

export function DashboardRetreatDetail({
  initialData,
}: {
  initialData?: RetreatBookingDetailDto | null;
}) {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [booking, setBooking] = useState<RetreatBookingDetailDto | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [payingBalance, setPayingBalance] = useState(false);
  const [showOnlineRoom, setShowOnlineRoom] = useState(false);
  const [openingReplay, setOpeningReplay] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [requestingCancellation, setRequestingCancellation] = useState(false);
  const [savingSecondaryGuest, setSavingSecondaryGuest] = useState(false);
  const [secondaryGuestSaved, setSecondaryGuestSaved] = useState(false);
  const [secondaryGuest, setSecondaryGuest] = useState({
    firstName: initialData?.secondaryGuest?.firstName || "",
    lastName: initialData?.secondaryGuest?.lastName || "",
    email: initialData?.secondaryGuest?.email || "",
    dietaryRequirements: initialData?.secondaryGuest?.dietaryRequirements || "",
  });

  useEffect(() => {
    if (initialData || !id) return;
    let active = true;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/me/retreats/${id}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load retreat booking.");
        const payload = (await response.json()) as {
          success: true;
          data: RetreatBookingDetailDto;
        };
        if (active) setBooking(payload.data);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load retreat booking."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, initialData]);

  useEffect(() => {
    if (!booking?.secondaryGuest) return;
    setSecondaryGuest({
      firstName: booking.secondaryGuest.firstName,
      lastName: booking.secondaryGuest.lastName,
      email: booking.secondaryGuest.email,
      dietaryRequirements: booking.secondaryGuest.dietaryRequirements || "",
    });
  }, [booking?.secondaryGuest]);

  const balanceState = searchParams.get("balance");

  const startBalanceCheckout = async () => {
    if (!booking) return;
    setPayingBalance(true);
    setError("");
    try {
      const response = await fetch(`/api/retreats/bookings/${booking.id}/balance-checkout`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        checkoutUrl?: string;
        message?: string;
      } | null;
      if (!response.ok || !payload?.checkoutUrl) {
        throw new Error(payload?.message || "Failed to start balance checkout.");
      }
      window.location.href = payload.checkoutUrl;
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to start balance checkout."
      );
      setPayingBalance(false);
    }
  };

  const openReplay = async () => {
    const replayAssetId = booking?.onlineAccess?.replayAssetId;
    if (!replayAssetId) return;
    setOpeningReplay(true);
    setError("");
    try {
      const response = await fetch(`/api/me/replays/${replayAssetId}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as {
        playbackUrl?: string;
        message?: string;
      } | null;
      if (!response.ok || !payload?.playbackUrl) {
        throw new Error(payload?.message || "The replay is not available right now.");
      }
      window.open(payload.playbackUrl, "_blank", "noopener,noreferrer");
    } catch (replayError) {
      setError(
        replayError instanceof Error
          ? replayError.message
          : "The replay is not available right now."
      );
    } finally {
      setOpeningReplay(false);
    }
  };

  const requestCancellation = async () => {
    if (!booking || !booking.canRequestCancellation) return;
    if (
      !window.confirm(
        "Send this cancellation request to Shruti? Your booking remains active until it is reviewed."
      )
    ) {
      return;
    }
    setRequestingCancellation(true);
    setError("");
    try {
      const response = await fetch(`/api/me/retreats/${booking.id}/cancellation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancellationReason }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            success: true;
            data: NonNullable<RetreatBookingDetailDto["latestCancellation"]>;
          }
        | { success: false; error: { message: string } }
        | null;
      if (!response.ok || !payload || !payload.success) {
        throw new Error(
          payload && payload.success === false
            ? payload.error.message
            : "Failed to request cancellation."
        );
      }
      setBooking({
        ...booking,
        canRequestCancellation: false,
        latestCancellation: payload.data,
      });
      setCancellationReason("");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to request cancellation."
      );
    } finally {
      setRequestingCancellation(false);
    }
  };

  const saveSecondaryGuest = async () => {
    if (!booking) return;
    setSavingSecondaryGuest(true);
    setSecondaryGuestSaved(false);
    setError("");
    try {
      const response = await fetch(`/api/me/retreats/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(secondaryGuest),
      });
      const payload = (await response.json().catch(() => null)) as
        | { success: true; data: RetreatBookingDetailDto }
        | { success: false; error: { message: string } }
        | null;
      if (!response.ok || !payload || !payload.success) {
        throw new Error(
          payload && payload.success === false
            ? payload.error.message
            : "Failed to save the second guest."
        );
      }
      setBooking(payload.data);
      setSecondaryGuestSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save the second guest.");
    } finally {
      setSavingSecondaryGuest(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Retreat Booking - Private Studio">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout title="Retreat Booking - Private Studio">
        <div className="py-16 text-center">
          <p className="text-muted-foreground">{error || "Retreat booking not found."}</p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/dashboard/retreats">Back to retreats</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (showOnlineRoom) {
    return (
      <VideoRoom
        sessionId={booking.id}
        roomTokenEndpoint={`/api/retreats/bookings/${booking.id}/room-token`}
        attendanceEndpoint={null}
        mode="retreat"
        isInstructor={false}
        className={booking.retreatTitle}
        classTime={new Intl.DateTimeFormat("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(booking.startsAt))}
        classDuration="Online workshop"
        registeredCount={1}
        initialMuted
        initialCameraOn={false}
        initialCommunityMode
        onLeave={() => setShowOnlineRoom(false)}
      />
    );
  }

  return (
    <DashboardLayout title="Retreat Booking - Private Studio">
      <div className="space-y-6">
        <Link
          href="/dashboard/retreats"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to retreats
        </Link>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-brand-accent mb-3 text-sm tracking-[0.18em] uppercase">
              Retreat booking
            </p>
            <h1 className="text-3xl">{booking.retreatTitle}</h1>
            <div className="text-muted-foreground mt-3 flex flex-wrap gap-4 text-sm">
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
          <div className="flex flex-wrap gap-2">
            <Badge variant={paymentVariant(booking.paymentStatus)}>
              {booking.paymentStatus.replaceAll("_", " ")}
            </Badge>
            <Badge variant="outline">{booking.bookingStatus.replaceAll("_", " ")}</Badge>
          </div>
        </div>

        {balanceState === "success" ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Your balance payment has been received.
          </div>
        ) : null}
        {balanceState === "cancelled" ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Balance checkout was cancelled. You can try again below whenever you're ready.
          </div>
        ) : null}
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <Card className="rounded-[1.5rem]">
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">Room</p>
                  <p className="mt-1">{booking.roomType || "Not selected"}</p>
                </div>
                {booking.addons.length > 0 ? (
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">
                      Optional extras
                    </p>
                    <div className="mt-1 space-y-1">
                      {booking.addons.map((addon) => (
                        <p key={addon.id}>
                          {addon.name} × {addon.quantity}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Balance due
                  </p>
                  <p className="mt-1">{formatDate(booking.balanceDueAt) || "Before arrival"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Emergency contact
                  </p>
                  <p className="mt-1">{booking.emergencyContactName}</p>
                  <p className="text-muted-foreground text-sm">{booking.emergencyContactPhone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Needs noted
                  </p>
                  <p className="mt-1">
                    {booking.dietaryRequirements ||
                    booking.mobilityNeeds ||
                    booking.medicalConditions
                      ? "Yes"
                      : "None provided"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {booking.attendeeCount > 1 ? (
              <Card className="rounded-[1.5rem]">
                <CardHeader>
                  <CardTitle className="text-lg">Second guest</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Add the person sharing this booking so Shruti can plan accommodation and food.
                    They will provide their own health and legal agreements separately.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="secondaryGuestFirstName">Given or chosen name</Label>
                      <Input
                        id="secondaryGuestFirstName"
                        value={secondaryGuest.firstName}
                        onChange={(event) =>
                          setSecondaryGuest((current) => ({
                            ...current,
                            firstName: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryGuestLastName">Family name</Label>
                      <Input
                        id="secondaryGuestLastName"
                        value={secondaryGuest.lastName}
                        onChange={(event) =>
                          setSecondaryGuest((current) => ({
                            ...current,
                            lastName: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryGuestEmail">Email</Label>
                    <Input
                      id="secondaryGuestEmail"
                      type="email"
                      value={secondaryGuest.email}
                      onChange={(event) =>
                        setSecondaryGuest((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryGuestDietaryRequirements">
                      Dietary requirements (optional)
                    </Label>
                    <Textarea
                      id="secondaryGuestDietaryRequirements"
                      value={secondaryGuest.dietaryRequirements}
                      onChange={(event) =>
                        setSecondaryGuest((current) => ({
                          ...current,
                          dietaryRequirements: event.target.value,
                        }))
                      }
                    />
                  </div>
                  {secondaryGuestSaved ? (
                    <p className="text-sm text-emerald-700" role="status">
                      Second guest details saved.
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={savingSecondaryGuest}
                    onClick={() => void saveSecondaryGuest()}
                  >
                    {savingSecondaryGuest ? "Saving..." : "Save second guest"}
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            <Card className="rounded-[1.5rem]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="text-brand-accent h-5 w-5" />
                  Information on file
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {booking.dietaryRequirements ? (
                  <div className="rounded-lg border p-4">
                    <p className="text-muted-foreground mb-1 text-xs tracking-wide uppercase">
                      Dietary requirements
                    </p>
                    <p>{booking.dietaryRequirements}</p>
                  </div>
                ) : null}
                {booking.mobilityNeeds ? (
                  <div className="rounded-lg border p-4">
                    <p className="text-muted-foreground mb-1 text-xs tracking-wide uppercase">
                      Accessibility / mobility
                    </p>
                    <p>{booking.mobilityNeeds}</p>
                  </div>
                ) : null}
                {booking.medicalConditions ? (
                  <div className="rounded-lg border p-4">
                    <p className="text-muted-foreground mb-1 text-xs tracking-wide uppercase">
                      Health notes
                    </p>
                    <p>{booking.medicalConditions}</p>
                  </div>
                ) : null}
                {!booking.dietaryRequirements &&
                !booking.mobilityNeeds &&
                !booking.medicalConditions ? (
                  <p className="text-muted-foreground">
                    No additional health or accessibility notes have been saved with this booking.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem]">
              <CardHeader>
                <CardTitle className="text-lg">Preparation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed">
                <p className="text-muted-foreground">
                  Keep an eye on your inbox for travel details, arrival guidance and any pre-retreat
                  notes. If your access or health needs change before the retreat, please update
                  Shruti as early as possible.
                </p>
                <Button asChild variant="outline">
                  <Link href="/contact">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Update my details
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {booking.retreatType === "online" ? (
              <Card className="border-brand-accent/20 rounded-[1.5rem]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Video className="text-brand-accent h-5 w-5" />
                    Online room
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-relaxed">
                  {booking.onlineAccess?.entitled ? (
                    <>
                      <p className="text-muted-foreground">
                        Your booking includes protected access to the live workshop. The room opens
                        shortly before the scheduled start time.
                      </p>
                      <Button
                        type="button"
                        onClick={() => setShowOnlineRoom(true)}
                        disabled={!booking.onlineAccess.liveAccessEnabled}
                      >
                        Join online room
                        <Video className="ml-2 h-4 w-4" />
                      </Button>
                      {booking.onlineAccess.replayAssetId ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void openReplay()}
                          disabled={openingReplay}
                        >
                          {openingReplay ? "Opening replay..." : "Watch replay"}
                        </Button>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      The online room is not ready yet. Shruti will share joining details before the
                      retreat starts.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-6">
            <Card className="border-brand-accent/20 rounded-[1.5rem]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="text-brand-accent h-5 w-5" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">Total</p>
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
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Your deposit is in place. The remaining balance can be paid here or via the
                    email link that was sent after booking.
                  </div>
                ) : (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <CheckCircle2 className="mr-2 inline h-4 w-4" />
                    This retreat booking is fully paid.
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Button
                    disabled={!booking.canPayBalance || payingBalance}
                    onClick={() => void startBalanceCheckout()}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {booking.canPayBalance
                      ? payingBalance
                        ? "Redirecting..."
                        : "Pay balance"
                      : "No payment due"}
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/retreats/${booking.retreatSlug}`}>View public retreat page</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem]">
              <CardHeader>
                <CardTitle className="text-lg">Next steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  This dashboard keeps your booking, payment status and key details in one place. If
                  you need a fresh balance link or want to change anything on file, get in touch and
                  we can sort it manually.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/contact">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contact Shruti
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <XCircle className="text-brand-accent h-5 w-5" />
                  Cancellation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {booking.latestCancellation ? (
                  <div className="rounded-lg border p-4">
                    <p className="font-medium">
                      Request {booking.latestCancellation.status.replaceAll("_", " ")}
                    </p>
                    <p className="text-muted-foreground mt-2">
                      Refund under the terms recorded for this request:{" "}
                      {formatCurrency(booking.latestCancellation.refundableAmountPence)}.
                    </p>
                    {booking.latestCancellation.adminDecisionReason ? (
                      <p className="text-muted-foreground mt-2">
                        Shruti's note: {booking.latestCancellation.adminDecisionReason}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {booking.canRequestCancellation ? (
                  <div className="space-y-3">
                    <p className="text-muted-foreground">
                      Requesting cancellation does not cancel the booking immediately. Shruti will
                      review the request against the terms recorded when you booked and confirm any
                      refund by email.
                    </p>
                    <Textarea
                      value={cancellationReason}
                      onChange={(event) => setCancellationReason(event.target.value)}
                      maxLength={2000}
                      placeholder="Add any context you would like Shruti to consider (optional)"
                      aria-label="Cancellation request note"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={requestingCancellation}
                      onClick={() => void requestCancellation()}
                    >
                      {requestingCancellation ? "Sending request..." : "Request cancellation"}
                    </Button>
                  </div>
                ) : !booking.latestCancellation ? (
                  <p className="text-muted-foreground">
                    Online cancellation is not available for this booking. Contact Shruti if you
                    need help.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
