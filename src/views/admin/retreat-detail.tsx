"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Download,
  ExternalLink,
  MapPin,
  PoundSterling,
  Save,
  Send,
  Users,
  Video,
} from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminRetreatDetailDto, AdminRetreatEvidenceDto } from "@/lib/api/types";

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
    month: "long",
    year: "numeric",
  });
  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function badgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "paid_in_full") return "default";
  if (status === "deposit_paid" || status === "balance_due") return "secondary";
  if (status === "cancelled") return "destructive";
  return "outline";
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function AdminRetreatDetail({
  initialData,
}: {
  initialData?: AdminRetreatDetailDto | null;
}) {
  const { id } = useParams<{ id: string }>();
  const [retreat, setRetreat] = useState<AdminRetreatDetailDto | null>(initialData || null);
  const [evidence, setEvidence] = useState<AdminRetreatEvidenceDto | null>(null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionLoading, setActionLoading] = useState<
    "" | "online-room" | "balance-due" | "chaser" | "early-bird"
  >("");
  const [earlyBirdDrafts, setEarlyBirdDrafts] = useState<
    Record<string, { pricePounds: string; endsAt: string }>
  >({});

  useEffect(() => {
    if (!retreat) return;
    setEarlyBirdDrafts(
      Object.fromEntries(
        retreat.ratePlans.map((ratePlan) => [
          ratePlan.id,
          {
            pricePounds:
              ratePlan.earlyBirdPricePence === null
                ? ""
                : (ratePlan.earlyBirdPricePence / 100).toFixed(2),
            endsAt: toDateTimeLocal(ratePlan.earlyBirdEndsAt),
          },
        ])
      )
    );
  }, [retreat]);

  useEffect(() => {
    if (initialData || !id) return;
    let active = true;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/admin/retreats/${id}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load retreat detail.");
        const payload = (await response.json()) as AdminRetreatDetailDto;
        if (active) setRetreat(payload);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load retreat detail."
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
    if (!id) return;
    let active = true;
    void (async () => {
      try {
        const response = await fetch(`/api/admin/retreats/${id}/evidence`, { cache: "no-store" });
        if (response.status === 401 || response.status === 403) {
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to load retreat evidence.");
        }
        const payload = (await response.json()) as AdminRetreatEvidenceDto;
        if (active) {
          setEvidence(payload);
        }
      } catch {
        if (active) {
          setEvidence(null);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const summary = useMemo(() => {
    if (!retreat) return null;
    const paidInFull = retreat.bookings.filter(
      (booking) => booking.paymentStatus === "paid_in_full"
    ).length;
    const balanceDue = retreat.bookings.filter(
      (booking) => booking.paymentStatus === "deposit_paid"
    ).length;
    const specialRequirements = retreat.bookings.filter(
      (booking) => booking.dietaryRequirements || booking.medicalConditions || booking.mobilityNeeds
    );
    return { paidInFull, balanceDue, specialRequirements };
  }, [retreat]);

  const runRetreatAction = async (
    action: "online-room" | "balance-due" | "chaser",
    request: () => Promise<Response>
  ) => {
    setActionLoading(action);
    setActionMessage("");
    setError("");
    try {
      const response = await request();
      const payload = (await response.json().catch(() => null)) as
        | AdminRetreatDetailDto
        | { sent?: number; skipped?: number; message?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          payload && "message" in payload && payload.message
            ? payload.message
            : "The retreat action failed."
        );
      }
      if (action === "online-room" && payload && "id" in payload) {
        setRetreat(payload);
        setActionMessage("Online room created.");
      } else if (payload && "sent" in payload) {
        setActionMessage(`Emails sent: ${payload.sent}. Skipped: ${payload.skipped ?? 0}.`);
      } else {
        setActionMessage("Action complete.");
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "The retreat action failed.");
    } finally {
      setActionLoading("");
    }
  };

  const saveEarlyBirdRates = async () => {
    setActionLoading("early-bird");
    setActionMessage("");
    setError("");
    try {
      const ratePlans = retreat.ratePlans.map((ratePlan) => {
        const draft = earlyBirdDrafts[ratePlan.id] || { pricePounds: "", endsAt: "" };
        const hasPrice = draft.pricePounds.trim().length > 0;
        const hasEndDate = draft.endsAt.length > 0;
        if (hasPrice !== hasEndDate) {
          throw new Error(
            `${ratePlan.roomLabel} for ${ratePlan.guestCount} ${ratePlan.guestCount === 1 ? "guest" : "guests"} needs both a price and deadline.`
          );
        }
        if (!hasPrice) {
          return {
            ratePlanId: ratePlan.id,
            earlyBirdPricePence: null,
            earlyBirdEndsAt: null,
          };
        }
        const earlyBirdPricePence = Math.round(Number(draft.pricePounds) * 100);
        if (
          !Number.isFinite(earlyBirdPricePence) ||
          earlyBirdPricePence < 0 ||
          earlyBirdPricePence >= ratePlan.totalPricePence
        ) {
          throw new Error(
            `${ratePlan.roomLabel} early-bird price must be lower than the standard price.`
          );
        }
        return {
          ratePlanId: ratePlan.id,
          earlyBirdPricePence,
          earlyBirdEndsAt: new Date(draft.endsAt).toISOString(),
        };
      });

      const response = await fetch(`/api/admin/retreats/${retreat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratePlans }),
      });
      const payload = (await response.json().catch(() => null)) as
        | AdminRetreatDetailDto
        | { message?: string }
        | null;
      if (!response.ok || !payload || !("id" in payload)) {
        throw new Error(
          payload && "message" in payload && payload.message
            ? payload.message
            : "Failed to update early-bird pricing."
        );
      }
      setRetreat(payload);
      setActionMessage("Early-bird pricing updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update pricing.");
    } finally {
      setActionLoading("");
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Retreat - Admin">
        <p className="text-muted-foreground">Loading retreat detail...</p>
      </AdminLayout>
    );
  }

  if (!retreat) {
    return (
      <AdminLayout title="Retreat - Admin">
        <div className="py-16 text-center">
          <p className="text-muted-foreground">{error || "Retreat not found."}</p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/admin/retreats">Back to retreats</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`${retreat.title} - Admin`}>
      <div className="space-y-6">
        <Link
          href="/admin/retreats"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to retreats
        </Link>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-brand-dark text-2xl">{retreat.title}</h1>
            <div className="text-muted-foreground mt-2 flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {retreat.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDateRange(retreat.startDate, retreat.endDate)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{retreat.status.replaceAll("_", " ")}</Badge>
            <Button
              variant="outline"
              onClick={() =>
                downloadCsv(`${retreat.retreatSlug}-attendees.csv`, [
                  [
                    "Purchaser",
                    "Purchaser Email",
                    "Attendee",
                    "Attendee Email",
                    "Room Type",
                    "Assigned Room",
                    "Attendee Count",
                    "Payment Status",
                    "Booking Status",
                    "Dietary",
                    "Medical",
                    "Mobility",
                  ],
                  ...retreat.bookings.map((booking) => [
                    booking.purchaserName,
                    booking.purchaserEmail,
                    booking.attendeeName,
                    booking.attendeeEmail,
                    booking.roomType || "",
                    booking.roomUnitLabel || "",
                    String(booking.attendeeCount || 1),
                    booking.paymentStatus,
                    booking.bookingStatus,
                    booking.dietaryRequirements || "",
                    booking.medicalConditions || "",
                    booking.mobilityNeeds || "",
                  ]),
                ])
              }
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {actionMessage ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            {actionMessage}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="text-brand-accent mx-auto h-5 w-5" />
              <p className="mt-2 text-2xl">{retreat.bookings.length}</p>
              <p className="text-muted-foreground text-xs">Bookings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <PoundSterling className="text-brand-accent mx-auto h-5 w-5" />
              <p className="mt-2 text-2xl">{formatCurrency(retreat.revenuePence)}</p>
              <p className="text-muted-foreground text-xs">Captured revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="mt-2 text-2xl">{summary?.paidInFull || 0}</p>
              <p className="text-muted-foreground text-xs">Paid in full</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="mt-2 text-2xl">{summary?.balanceDue || 0}</p>
              <p className="text-muted-foreground text-xs">Balance still due</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Early-bird pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-muted-foreground text-sm">
                Set pricing separately for each room and guest count. Clear both fields to remove an
                early-bird rate. Stripe uses the active server-calculated rate when checkout is
                created.
              </p>
              <div className="space-y-4">
                {retreat.ratePlans.map((ratePlan) => {
                  const draft = earlyBirdDrafts[ratePlan.id] || {
                    pricePounds: "",
                    endsAt: "",
                  };
                  const label = `${ratePlan.roomLabel} · ${ratePlan.guestCount} ${ratePlan.guestCount === 1 ? "guest" : "guests"}`;
                  return (
                    <div
                      key={ratePlan.id}
                      className="grid gap-4 rounded-lg border p-4 md:grid-cols-[1.2fr_0.8fr_1fr] md:items-end"
                    >
                      <div>
                        <p className="font-medium">{label}</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          Standard price {formatCurrency(ratePlan.totalPricePence)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`early-price-${ratePlan.id}`}>Early-bird price (£)</Label>
                        <Input
                          id={`early-price-${ratePlan.id}`}
                          type="number"
                          min="0"
                          max={(ratePlan.totalPricePence - 1) / 100}
                          step="0.01"
                          value={draft.pricePounds}
                          onChange={(event) =>
                            setEarlyBirdDrafts((current) => ({
                              ...current,
                              [ratePlan.id]: { ...draft, pricePounds: event.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`early-end-${ratePlan.id}`}>Available until</Label>
                        <Input
                          id={`early-end-${ratePlan.id}`}
                          type="datetime-local"
                          max={toDateTimeLocal(retreat.startDate)}
                          value={draft.endsAt}
                          onChange={(event) =>
                            setEarlyBirdDrafts((current) => ({
                              ...current,
                              [ratePlan.id]: { ...draft, endsAt: event.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button
                type="button"
                disabled={actionLoading !== ""}
                onClick={() => void saveEarlyBirdRates()}
              >
                <Save className="mr-2 h-4 w-4" />
                {actionLoading === "early-bird" ? "Saving..." : "Save early-bird pricing"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment structure</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  Retreat price
                </p>
                <p className="mt-1">{formatCurrency(retreat.pricePence)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Deposit</p>
                <p className="mt-1">{formatCurrency(retreat.depositAmountPence)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  Single room supplement
                </p>
                <p className="mt-1">{formatCurrency(retreat.singleRoomSupplementPence)}</p>
              </div>
              <div className="sm:col-span-3">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  Balance due date
                </p>
                <p className="mt-1">
                  {retreat.balanceDueAt
                    ? new Intl.DateTimeFormat("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }).format(new Date(retreat.balanceDueAt))
                    : "Before arrival"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Operational actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {retreat.retreatType === "online" ? (
                <div className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <Video className="text-brand-accent mt-1 h-5 w-5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">Online room</p>
                      <p className="text-muted-foreground mt-1">
                        Status: {retreat.roomSetupStatus.replaceAll("_", " ")}
                      </p>
                      {retreat.dailyRoomUrl ? (
                        <a
                          href={retreat.dailyRoomUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-accent mt-2 inline-flex items-center gap-1 underline"
                        >
                          Open room
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                      {retreat.roomSetupError ? (
                        <p className="mt-2 text-red-700">{retreat.roomSetupError}</p>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="mt-4 w-full"
                    disabled={actionLoading !== ""}
                    onClick={() =>
                      void runRetreatAction("online-room", () =>
                        fetch(`/api/admin/retreats/${retreat.id}/online-room`, {
                          method: "POST",
                        })
                      )
                    }
                  >
                    <Video className="mr-2 h-4 w-4" />
                    {actionLoading === "online-room" ? "Creating..." : "Create or refresh room"}
                  </Button>
                </div>
              ) : null}

              <div className="rounded-lg border p-4">
                <p className="font-medium">Balance emails</p>
                <p className="text-muted-foreground mt-1">
                  Send the balance due email when balances are ready to collect. Use chasers after
                  the first due email has gone out.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={actionLoading !== ""}
                    onClick={() =>
                      void runRetreatAction("balance-due", () =>
                        fetch(`/api/admin/retreats/${retreat.id}/balance-emails`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ mode: "due" }),
                        })
                      )
                    }
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {actionLoading === "balance-due" ? "Sending..." : "Send due email"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={actionLoading !== ""}
                    onClick={() =>
                      void runRetreatAction("chaser", () =>
                        fetch(`/api/admin/retreats/${retreat.id}/balance-emails`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ mode: "chaser" }),
                        })
                      )
                    }
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {actionLoading === "chaser" ? "Sending..." : "Send chaser"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {evidence ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Owner-admin legal evidence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 text-sm">
                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Guest bookings
                  </p>
                  {evidence.bookings.length === 0 ? (
                    <p className="text-muted-foreground">No guest acceptance evidence recorded.</p>
                  ) : (
                    evidence.bookings.map((booking) => (
                      <div key={booking.id} className="rounded-lg border p-3">
                        <p className="font-medium">{booking.purchaserEmail}</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Booking {booking.id} · {booking.bookingStatus} · {booking.paymentStatus}
                        </p>
                        <div className="mt-3 space-y-2">
                          {booking.guestAcceptances.map((event) => (
                            <div key={event.id} className="bg-muted/40 rounded-md px-3 py-2">
                              <p>
                                {event.type.replaceAll("_", " ")} · {event.version}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {new Date(event.acceptedAt).toLocaleString("en-GB")} ·{" "}
                                {event.surface}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Guest gifts
                  </p>
                  {evidence.gifts.length === 0 ? (
                    <p className="text-muted-foreground">No guest gift evidence recorded.</p>
                  ) : (
                    evidence.gifts.map((gift) => (
                      <div key={gift.id} className="rounded-lg border p-3">
                        <p className="font-medium">{gift.purchaserEmail}</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Gift {gift.id} · {gift.status} · Recipient {gift.recipientEmail}
                        </p>
                        <div className="mt-3 space-y-2">
                          {gift.guestAcceptances.map((event) => (
                            <div key={event.id} className="bg-muted/40 rounded-md px-3 py-2">
                              <p>
                                {event.type.replaceAll("_", " ")} · {event.version}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {new Date(event.acceptedAt).toLocaleString("en-GB")} ·{" "}
                                {event.surface}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="text-brand-accent h-5 w-5" />
                Special requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {summary && summary.specialRequirements.length > 0 ? (
                summary.specialRequirements.map((booking) => (
                  <div key={booking.id} className="rounded-lg border p-4">
                    <p>{booking.attendeeName}</p>
                    {booking.dietaryRequirements ? (
                      <p className="text-muted-foreground mt-2">
                        Dietary: {booking.dietaryRequirements}
                      </p>
                    ) : null}
                    {booking.medicalConditions ? (
                      <p className="text-muted-foreground mt-1">
                        Medical: {booking.medicalConditions}
                      </p>
                    ) : null}
                    {booking.mobilityNeeds ? (
                      <p className="text-muted-foreground mt-1">
                        Mobility: {booking.mobilityNeeds}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No special requirements have been recorded.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attendee roster</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="py-3 pr-4">Attendee</th>
                  <th className="py-3 pr-4">Purchaser</th>
                  <th className="py-3 pr-4">Room</th>
                  <th className="py-3 pr-4">Payment</th>
                  <th className="py-3 pr-4">Booked</th>
                </tr>
              </thead>
              <tbody>
                {retreat.bookings.map((booking) => (
                  <tr key={booking.id} className="border-border/50 border-b">
                    <td className="py-3 pr-4">
                      <p>{booking.attendeeName}</p>
                      <p className="text-muted-foreground mt-1 text-xs">{booking.attendeeEmail}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <p>{booking.purchaserName}</p>
                      <p className="text-muted-foreground mt-1 text-xs">{booking.purchaserEmail}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <p>{booking.roomType || "Shared"}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {booking.roomUnitLabel || "Not assigned"} · {booking.attendeeCount || 1}{" "}
                        {(booking.attendeeCount || 1) === 1 ? "person" : "people"}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-col gap-1">
                        <Badge variant={badgeVariant(booking.paymentStatus)}>
                          {booking.paymentStatus.replaceAll("_", " ")}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {formatCurrency(booking.depositPaidPence + booking.balancePaidPence)} of{" "}
                          {formatCurrency(booking.totalPricePence)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      {new Intl.DateTimeFormat("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(booking.bookedAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
