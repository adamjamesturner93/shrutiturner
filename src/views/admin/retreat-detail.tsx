"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Download,
  MapPin,
  PoundSterling,
  Users,
} from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminRetreatDetailDto } from "@/lib/api/types";

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
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");

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
                    <td className="py-3 pr-4">{booking.roomType || "Shared"}</td>
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
