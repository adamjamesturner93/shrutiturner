"use client";

import { DashboardLayout } from "../../components/dashboard-layout";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin, Mountain, Check } from "lucide-react";
import { getUpcomingRetreats, retreats } from "../../data/retreat-data";
import { useI18n } from "../../lib/use-i18n";

/* Mock: which retreat the user has booked */
const BOOKED_RETREAT_IDS = ["1"];

function getDaysUntil(date: string) {
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86400000));
}

export function DashboardRetreats() {
  const upcomingRetreats = getUpcomingRetreats();
  const { fmtDateRange, fmtDateMedium } = useI18n();

  return (
    <DashboardLayout title="Retreats - Private Studio">
      <h1 className="mb-2 text-3xl">Your Retreats</h1>
      <p className="text-muted-foreground mb-8">
        View your booked retreats and explore upcoming experiences.
      </p>

      {/* Booked retreats */}
      {BOOKED_RETREAT_IDS.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 text-xl">Booked</h2>
          <div className="space-y-4">
            {BOOKED_RETREAT_IDS.map((id) => {
              const retreat = retreats.find((r) => r.id === id);
              if (!retreat) return null;
              const nextDate = retreat.dates[0];
              const daysUntil = nextDate ? getDaysUntil(nextDate.startDate) : null;

              return (
                <div
                  key={retreat.id}
                  className="bg-background border-brand-accent rounded-lg border-2 p-6"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-brand-accent text-brand-white">
                          <Check className="mr-1 h-3 w-3" />
                          Booked
                        </Badge>
                        {daysUntil !== null && daysUntil <= 60 && (
                          <Badge variant="outline">{daysUntil} days away</Badge>
                        )}
                      </div>
                      <h3 className="text-xl">{retreat.title}</h3>
                      <p className="text-muted-foreground text-sm">{retreat.subtitle}</p>
                      <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="text-brand-accent h-3.5 w-3.5" />
                          {retreat.location}
                        </span>
                        {nextDate && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="text-brand-accent h-3.5 w-3.5" />
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
        <h2 className="mb-4 text-xl">Explore Upcoming Retreats</h2>
        {upcomingRetreats.length === 0 ? (
          <div className="bg-background rounded-lg border p-8 text-center">
            <Mountain className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
            <p className="text-muted-foreground">
              No upcoming retreats at the moment. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingRetreats.map((retreat) => {
              const isBooked = BOOKED_RETREAT_IDS.includes(retreat.id);
              const nextDate = retreat.dates[0];

              return (
                <div
                  key={retreat.id}
                  className={`bg-background space-y-3 rounded-lg border p-5 ${
                    isBooked ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg">{retreat.title}</h3>
                    {isBooked && (
                      <Badge
                        variant="outline"
                        className="border-brand-accent text-brand-accent flex-shrink-0"
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Booked
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">{retreat.subtitle}</p>
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5" />
                    {retreat.location}
                  </div>
                  {nextDate && (
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Calendar className="h-3.5 w-3.5" />
                      {fmtDateRange(new Date(nextDate.startDate), new Date(nextDate.endDate))}
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg">£{retreat.earlyBirdPrice.toLocaleString()}</span>
                    <span className="text-muted-foreground text-xs">early bird</span>
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
