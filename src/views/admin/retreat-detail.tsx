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
  Mail,
  MapPin,
  PoundSterling,
  Users,
  Video,
} from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [balanceEmailStatus, setBalanceEmailStatus] = useState("");
  const [sendingBalanceEmail, setSendingBalanceEmail] = useState<"due" | "chaser" | null>(null);
  const [onlineRoomStatus, setOnlineRoomStatus] = useState("");
  const [settingUpOnlineRoom, setSettingUpOnlineRoom] = useState(false);

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

  async function handleSendBalanceEmails(mode: "due" | "chaser") {
    if (!id) return;

    setSendingBalanceEmail(mode);
    setBalanceEmailStatus("");
    try {
      const response = await fetch(`/api/admin/retreats/${id}/balance-emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        sent?: number;
        skipped?: number;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.message || "Failed to send balance emails.");
      }
      const sent = payload.sent || 0;
      const skipped = payload.skipped || 0;
      setBalanceEmailStatus(
        `${mode === "chaser" ? "Chaser" : "Balance due"} email sent to ${sent} booking${
          sent === 1 ? "" : "s"
        }${skipped ? `; ${skipped} skipped` : ""}.`
      );
    } catch (sendError) {
      setBalanceEmailStatus(
        sendError instanceof Error ? sendError.message : "Failed to send balance emails."
      );
    } finally {
      setSendingBalanceEmail(null);
    }
  }

  async function handleSetUpOnlineRoom() {
    if (!id) return;

    setSettingUpOnlineRoom(true);
    setOnlineRoomStatus("");
    try {
      const response = await fetch(`/api/admin/retreats/${id}/online-room`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as
        | AdminRetreatDetailDto
        | { message?: string };
      if (!response.ok) {
        throw new Error("message" in payload ? payload.message : "Failed to set up online room.");
      }
      setRetreat(payload as AdminRetreatDetailDto);
      setOnlineRoomStatus("Online room is ready.");
    } catch (setupError) {
      setOnlineRoomStatus(
        setupError instanceof Error ? setupError.message : "Failed to set up online room."
      );
    } finally {
      setSettingUpOnlineRoom(false);
    }
  }

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
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{retreat.status.replaceAll("_", " ")}</Badge>
            <Button
              variant="outline"
              disabled={sendingBalanceEmail !== null || !summary?.balanceDue}
              onClick={() => void handleSendBalanceEmails("due")}
            >
              <Mail className="mr-2 h-4 w-4" />
              {sendingBalanceEmail === "due" ? "Sending..." : "Send balance emails"}
            </Button>
            <Button
              variant="outline"
              disabled={sendingBalanceEmail !== null || !summary?.balanceDue}
              onClick={() => void handleSendBalanceEmails("chaser")}
            >
              <Mail className="mr-2 h-4 w-4" />
              {sendingBalanceEmail === "chaser" ? "Sending..." : "Send chaser"}
            </Button>
            {retreat.retreatType === "online" ? (
              <>
                {retreat.dailyRoomUrl && retreat.roomSetupStatus === "ready" ? (
                  <Button asChild variant="outline">
                    <a href={retreat.dailyRoomUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open online room
                    </a>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    disabled={settingUpOnlineRoom}
                    onClick={() => void handleSetUpOnlineRoom()}
                  >
                    <Video className="mr-2 h-4 w-4" />
                    {settingUpOnlineRoom ? "Setting up..." : "Set up online room"}
                  </Button>
                )}
              </>
            ) : null}
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
        {summary?.balanceDue ? (
          <p className="text-muted-foreground text-sm">
            Suggested timing: send the balance due email around 8 weeks before the retreat starts,
            then send one chaser 1-2 weeks before the balance due date.
          </p>
        ) : null}
        {balanceEmailStatus ? (
          <p className="text-muted-foreground text-sm">{balanceEmailStatus}</p>
        ) : null}
        {retreat.retreatType === "online" && (onlineRoomStatus || retreat.roomSetupError) ? (
          <p className="text-muted-foreground text-sm">
            {onlineRoomStatus || retreat.roomSetupError}
          </p>
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
                  <th className="py-3 pr-4">Instalments</th>
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
                      {booking.roomUnitLabel ? (
                        <p className="text-muted-foreground mt-1 text-xs">
                          Unit: {booking.roomUnitLabel}
                        </p>
                      ) : null}
                      {booking.attendeeCount ? (
                        <p className="text-muted-foreground mt-1 text-xs">
                          {booking.attendeeCount} attendee{booking.attendeeCount === 1 ? "" : "s"}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="space-y-1">
                        {(booking.instalments || []).map((instalment) => (
                          <div key={instalment.id} className="text-xs">
                            <span>{instalment.label}: </span>
                            <span>{formatCurrency(instalment.amountPence)}</span>
                            <span className="text-muted-foreground">
                              {" "}
                              ({instalment.status.replaceAll("_", " ")})
                            </span>
                          </div>
                        ))}
                        {booking.payInFullDiscountPence ? (
                          <p className="text-muted-foreground text-xs">
                            Pay in full discount: {formatCurrency(booking.payInFullDiscountPence)}
                          </p>
                        ) : null}
                        {booking.nonRefundableAmountPence ? (
                          <p className="text-muted-foreground text-xs">
                            Non-refundable: {formatCurrency(booking.nonRefundableAmountPence)}
                          </p>
                        ) : null}
                      </div>
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
