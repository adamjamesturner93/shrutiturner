"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  PoundSterling,
  Mail,
  AlertCircle,
  Accessibility,
  UtensilsCrossed,
} from "lucide-react";
import { adminRetreats } from "../../data/admin-data";
import { HealthBadges, ClassHealthSummary } from "../../components/admin/health-badges";

export function AdminRetreatDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const navigate = (href: string, opts?: { replace?: boolean }) =>
    opts?.replace ? router.replace(href) : router.push(href);
  const retreat = adminRetreats.find((r) => r.id === id);

  if (!retreat) {
    return (
      <AdminLayout title="Retreat Not Found - Admin">
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Retreat not found.</p>
          <Link href="/admin/retreats">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Retreats
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const confirmedBookings = retreat.bookings.filter((b) => b.status === "confirmed");
  const earlyBirdCount = confirmedBookings.filter((b) => b.priceType === "early-bird").length;
  const normalCount = confirmedBookings.filter((b) => b.priceType === "normal").length;
  const specialRequirements = confirmedBookings.filter(
    (b) => b.dietaryRequirements || b.accessibilityNeeds
  );

  return (
    <AdminLayout title={`${retreat.title} - Admin`}>
      <div className="space-y-6">
        {/* Back nav */}
        <button
          onClick={() => navigate("/admin/retreats")}
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Retreats
        </button>

        {/* Header */}
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-brand-dark text-2xl">{retreat.title}</h1>
            <Badge
              variant={
                retreat.status === "open"
                  ? "default"
                  : retreat.status === "sold-out"
                    ? "destructive"
                    : "outline"
              }
            >
              {retreat.status.charAt(0).toUpperCase() + retreat.status.slice(1)}
            </Badge>
          </div>
          <div className="text-muted-foreground mt-2 flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {retreat.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(retreat.startDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              -{" "}
              {new Date(retreat.endDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="text-brand-accent mx-auto h-5 w-5" />
              <p className="text-brand-dark mt-2 text-2xl">
                {retreat.bookedSpaces}/{retreat.totalSpaces}
              </p>
              <p className="text-muted-foreground text-xs">Booked / Capacity</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <PoundSterling className="text-brand-accent mx-auto h-5 w-5" />
              <p className="text-brand-dark mt-2 text-2xl">£{retreat.revenue.toLocaleString()}</p>
              <p className="text-muted-foreground text-xs">Revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <PoundSterling className="text-brand-accent mx-auto h-5 w-5" />
              <p className="text-brand-dark mt-2 text-2xl">{earlyBirdCount}</p>
              <p className="text-muted-foreground text-xs">
                Early bird (£{retreat.earlyBirdPrice})
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <PoundSterling className="text-muted-foreground mx-auto h-5 w-5" />
              <p className="text-brand-dark mt-2 text-2xl">{normalCount}</p>
              <p className="text-muted-foreground text-xs">Normal (£{retreat.normalPrice})</p>
            </CardContent>
          </Card>
        </div>

        {/* Capacity bar */}
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span>{retreat.totalSpaces - retreat.bookedSpaces} spaces remaining</span>
            <span className="text-muted-foreground">
              {Math.round((retreat.bookedSpaces / retreat.totalSpaces) * 100)}% filled
            </span>
          </div>
          <div className="bg-secondary h-3 overflow-hidden rounded-full">
            <div
              className="bg-brand-accent h-full rounded-full transition-all"
              style={{
                width: `${(retreat.bookedSpaces / retreat.totalSpaces) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Aggregated health prep for retreat attendees */}
        <ClassHealthSummary attendees={confirmedBookings} />

        {/* Bookings table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bookings ({confirmedBookings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-muted-foreground py-3 pr-4 text-left">Name</th>
                    <th className="text-muted-foreground hidden py-3 pr-4 text-left md:table-cell">
                      Email
                    </th>
                    <th className="text-muted-foreground py-3 pr-4 text-left">Price</th>
                    <th className="text-muted-foreground hidden py-3 pr-4 text-left sm:table-cell">
                      Booked
                    </th>
                    <th className="text-muted-foreground py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {retreat.bookings.map((booking) => (
                    <tr key={booking.memberId} className="border-border/50 border-b">
                      <td className="py-3 pr-4">
                        <Link
                          href={
                            booking.memberId.startsWith("prog_ext")
                              ? "#"
                              : `/admin/members/${booking.memberId}`
                          }
                          className="hover:text-brand-accent transition-colors"
                        >
                          {booking.memberName}
                        </Link>
                        <div className="mt-1">
                          <HealthBadges memberId={booking.memberId} max={3} />
                        </div>
                      </td>
                      <td className="text-muted-foreground hidden py-3 pr-4 md:table-cell">
                        {booking.email}
                      </td>
                      <td className="py-3 pr-4">
                        £{booking.pricePaid}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {booking.priceType === "early-bird" ? "Early bird" : "Normal"}
                        </Badge>
                      </td>
                      <td className="text-muted-foreground hidden py-3 pr-4 sm:table-cell">
                        {new Date(booking.bookingDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            booking.status === "confirmed"
                              ? "default"
                              : booking.status === "cancelled" || booking.status === "refunded"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Special requirements */}
        {specialRequirements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Special Requirements ({specialRequirements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {specialRequirements.map((booking) => (
                  <div
                    key={booking.memberId}
                    className="rounded-lg border border-amber-100 bg-amber-50 p-3"
                  >
                    <p className="text-sm">{booking.memberName}</p>
                    {booking.dietaryRequirements && (
                      <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                        <UtensilsCrossed className="h-3.5 w-3.5" />
                        <span>{booking.dietaryRequirements}</span>
                      </div>
                    )}
                    {booking.accessibilityNeeds && (
                      <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                        <Accessibility className="h-3.5 w-3.5" />
                        <span>{booking.accessibilityNeeds}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
