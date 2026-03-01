"use client";

import { DashboardLayout } from "../../components/dashboard-layout";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  MapPin,
  Mountain,
  Check,
} from "lucide-react";
import { getUpcomingRetreats, retreats } from "../../data/retreat-data";
import { useI18n } from "../../lib/use-i18n";

/* Mock: which retreat the user has booked */
const BOOKED_RETREAT_IDS = ["1"];

export function DashboardRetreats() {
  const upcomingRetreats = getUpcomingRetreats();
  const { fmtDateRange, fmtDateMedium } = useI18n();

  return (
    <DashboardLayout title="Retreats - Private Studio">
      <h1 className="text-3xl mb-2">Your Retreats</h1>
      <p className="text-muted-foreground mb-8">
        View your booked retreats and explore upcoming experiences.
      </p>

      {/* Booked retreats */}
      {BOOKED_RETREAT_IDS.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl mb-4">Booked</h2>
          <div className="space-y-4">
            {BOOKED_RETREAT_IDS.map((id) => {
              const retreat = retreats.find((r) => r.id === id);
              if (!retreat) return null;
              const nextDate = retreat.dates[0];
              const daysUntil = nextDate
                ? Math.max(
                    0,
                    Math.ceil(
                      (new Date(nextDate.startDate).getTime() - Date.now()) /
                        86400000
                    )
                  )
                : null;

              return (
                <div
                  key={retreat.id}
                  className="bg-background border-2 border-[#4B5B32] rounded-lg p-6"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-[#4B5B32] text-[#FAFAF8]">
                          <Check className="w-3 h-3 mr-1" />
                          Booked
                        </Badge>
                        {daysUntil !== null && daysUntil <= 60 && (
                          <Badge variant="outline">
                            {daysUntil} days away
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl">{retreat.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {retreat.subtitle}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#4B5B32]" />
                          {retreat.location}
                        </span>
                        {nextDate && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#4B5B32]" />
                            {fmtDateRange(nextDate.startDate, nextDate.endDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Link href={`/dashboard/retreats/${retreat.id}`}>
                        <Button>
                          View Details & Prep
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming retreats to explore */}
      <div>
        <h2 className="text-xl mb-4">Explore Upcoming Retreats</h2>
        {upcomingRetreats.length === 0 ? (
          <div className="bg-background border rounded-lg p-8 text-center">
            <Mountain className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No upcoming retreats at the moment. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {upcomingRetreats.map((retreat) => {
              const isBooked = BOOKED_RETREAT_IDS.includes(retreat.id);
              const nextDate = retreat.dates[0];

              return (
                <div
                  key={retreat.id}
                  className={`bg-background border rounded-lg p-5 space-y-3 ${
                    isBooked ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg">{retreat.title}</h3>
                    {isBooked && (
                      <Badge
                        variant="outline"
                        className="text-[#4B5B32] border-[#4B5B32] flex-shrink-0"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Booked
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {retreat.subtitle}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    {retreat.location}
                  </div>
                  {nextDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {fmtDateRange(
                        new Date(nextDate.startDate),
                        new Date(nextDate.endDate)
                      )}
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg">
                      £{retreat.earlyBirdPrice.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      early bird
                    </span>
                  </div>
                  {isBooked ? (
                    <Link href={`/dashboard/retreats/${retreat.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details & Prep
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/retreats/${retreat.slug}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Learn More
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
