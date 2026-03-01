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
        <div className="text-center py-20">
          <p className="text-muted-foreground">Retreat not found.</p>
          <Link href="/admin/retreats">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Retreats
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const confirmedBookings = retreat.bookings.filter(
    (b) => b.status === "confirmed"
  );
  const earlyBirdCount = confirmedBookings.filter(
    (b) => b.priceType === "early-bird"
  ).length;
  const normalCount = confirmedBookings.filter(
    (b) => b.priceType === "normal"
  ).length;
  const specialRequirements = confirmedBookings.filter(
    (b) => b.dietaryRequirements || b.accessibilityNeeds
  );

  return (
    <AdminLayout title={`${retreat.title} - Admin`}>
      <div className="space-y-6">
        {/* Back nav */}
        <button
          onClick={() => navigate("/admin/retreats")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Retreats
        </button>

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl text-[#2E1F33]">{retreat.title}</h1>
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
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {retreat.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-5 h-5 text-[#4B5B32] mx-auto" />
              <p className="text-2xl text-[#2E1F33] mt-2">
                {retreat.bookedSpaces}/{retreat.totalSpaces}
              </p>
              <p className="text-xs text-muted-foreground">Booked / Capacity</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <PoundSterling className="w-5 h-5 text-[#4B5B32] mx-auto" />
              <p className="text-2xl text-[#2E1F33] mt-2">
                £{retreat.revenue.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <PoundSterling className="w-5 h-5 text-[#4B5B32] mx-auto" />
              <p className="text-2xl text-[#2E1F33] mt-2">{earlyBirdCount}</p>
              <p className="text-xs text-muted-foreground">
                Early bird (£{retreat.earlyBirdPrice})
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <PoundSterling className="w-5 h-5 text-muted-foreground mx-auto" />
              <p className="text-2xl text-[#2E1F33] mt-2">{normalCount}</p>
              <p className="text-xs text-muted-foreground">
                Normal (£{retreat.normalPrice})
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Capacity bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>
              {retreat.totalSpaces - retreat.bookedSpaces} spaces remaining
            </span>
            <span className="text-muted-foreground">
              {Math.round((retreat.bookedSpaces / retreat.totalSpaces) * 100)}%
              filled
            </span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4B5B32] rounded-full transition-all"
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
            <CardTitle className="text-lg">
              Bookings ({confirmedBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 pr-4 text-muted-foreground">
                      Name
                    </th>
                    <th className="text-left py-3 pr-4 text-muted-foreground hidden md:table-cell">
                      Email
                    </th>
                    <th className="text-left py-3 pr-4 text-muted-foreground">
                      Price
                    </th>
                    <th className="text-left py-3 pr-4 text-muted-foreground hidden sm:table-cell">
                      Booked
                    </th>
                    <th className="text-left py-3 text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {retreat.bookings.map((booking) => (
                    <tr
                      key={booking.memberId}
                      className="border-b border-border/50"
                    >
                      <td className="py-3 pr-4">
                        <Link href={
                            booking.memberId.startsWith("prog_ext")
                              ? "#"
                              : `/admin/members/${booking.memberId}`
                          }
                          className="hover:text-[#4B5B32] transition-colors"
                        >
                          {booking.memberName}
                        </Link>
                        <div className="mt-1">
                          <HealthBadges memberId={booking.memberId} max={3} />
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground hidden md:table-cell">
                        {booking.email}
                      </td>
                      <td className="py-3 pr-4">
                        £{booking.pricePaid}
                        <Badge
                          variant="outline"
                          className="ml-2 text-xs"
                        >
                          {booking.priceType === "early-bird"
                            ? "Early bird"
                            : "Normal"}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground hidden sm:table-cell">
                        {new Date(booking.bookingDate).toLocaleDateString(
                          "en-GB",
                          { day: "numeric", month: "short" }
                        )}
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            booking.status === "confirmed"
                              ? "default"
                              : booking.status === "cancelled" ||
                                booking.status === "refunded"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {booking.status.charAt(0).toUpperCase() +
                            booking.status.slice(1)}
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
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Special Requirements ({specialRequirements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {specialRequirements.map((booking) => (
                  <div
                    key={booking.memberId}
                    className="p-3 rounded-lg bg-amber-50 border border-amber-100"
                  >
                    <p className="text-sm">{booking.memberName}</p>
                    {booking.dietaryRequirements && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <UtensilsCrossed className="w-3.5 h-3.5" />
                        <span>{booking.dietaryRequirements}</span>
                      </div>
                    )}
                    {booking.accessibilityNeeds && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Accessibility className="w-3.5 h-3.5" />
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
