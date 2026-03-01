"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "../../components/dashboard-layout";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Calendar,
  MapPin,
  Video,
  FileText,
  Plane,
  Clock,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Users,
  Utensils,
  Thermometer,
  Luggage,
  Heart,
  Mountain,
} from "lucide-react";
import { getUpcomingRetreats, getRetreatById } from "../../data/retreat-data";
import { useI18n } from "../../lib/use-i18n";

/* ──── Mock booked retreat data ──── */

const BOOKED_RETREAT = {
  retreatId: "1",
  dateId: "1a",
  bookingRef: "RT-2026-0042",
  bookedAt: "2026-03-10",
  roomType: "Twin Share",
  dietaryNotes: "Vegetarian, dairy-free",
  emergencyContact: "James Turner — 07XXX XXXXXX",
  paymentStatus: "Paid in full",
  amountPaid: 1450,
};

const PREP_MATERIALS = [
  {
    id: "welcome-pack",
    title: "Welcome Pack",
    description:
      "Everything you need to know before arriving — what to expect, daily rhythms, and how to prepare your body.",
    type: "PDF",
    size: "2.4 MB",
    category: "essential",
  },
  {
    id: "packing-list",
    title: "Packing List",
    description:
      "A considered packing list including yoga kit, comfort items for chronic illness, and Portugal-specific essentials.",
    type: "PDF",
    size: "890 KB",
    category: "essential",
  },
  {
    id: "pre-retreat-movement",
    title: "Pre-Retreat Movement Guide",
    description:
      "A 2-week gentle preparation sequence to help your body feel ready. No obligation — do what feels manageable.",
    type: "PDF",
    size: "1.8 MB",
    category: "optional",
  },
  {
    id: "dietary-form",
    title: "Dietary & Accessibility Form",
    description:
      "Confirm your dietary requirements, accessibility needs, and anything else we should know.",
    type: "Form",
    size: "",
    category: "essential",
  },
  {
    id: "health-questionnaire",
    title: "Health Questionnaire",
    description:
      "A private questionnaire about your conditions and current capacity so we can support you fully.",
    type: "Form",
    size: "",
    category: "essential",
  },
  {
    id: "travel-insurance-guide",
    title: "Travel Insurance Guide",
    description:
      "Recommendations for travel insurance that covers pre-existing conditions. You must have insurance.",
    type: "PDF",
    size: "450 KB",
    category: "essential",
  },
];

const TRAVEL_INFO = {
  venue: {
    name: "Quinta da Serenidade",
    address: "Rua do Repouso 14, Montemor-o-Novo, Alentejo, Portugal",
    coordinates: "38.6475° N, 8.2178° W",
    description:
      "A traditional Portuguese quinta (estate) set in rolling countryside 90 minutes east of Lisbon. The property has a pool, gardens, yoga shala, and shaded outdoor spaces. The villa is single-storey with step-free access throughout.",
  },
  gettingThere: [
    {
      method: "By air",
      details:
        "Fly to Lisbon Humberto Delgado Airport (LIS). Airport transfers are included — we'll pick you up between 2-4pm on arrival day.",
    },
    {
      method: "Flight recommendations",
      details:
        "Direct flights from London Gatwick, Heathrow, Stansted, and Manchester. EasyJet and TAP Portugal typically offer the best routes. Book early for best prices.",
    },
    {
      method: "By car",
      details:
        "If driving from Lisbon, take the A6 towards Évora. Exit at Montemor-o-Novo. Approximately 90 minutes. Free parking at the venue.",
    },
    {
      method: "Transfer timing",
      details:
        "Airport pickup at 2pm and 4pm on arrival day. Return transfers depart at 10am on departure day. Please book flights accordingly.",
    },
  ],
  weather: {
    month: "September",
    avgTemp: "25-30°C during the day, 15-18°C in the evening",
    conditions:
      "Warm and dry. Occasional breeze. Bring a light layer for evenings and early mornings. Sun protection essential.",
  },
  practicalNotes: [
    "The venue is entirely step-free and wheelchair-accessible on the ground floor.",
    "All rooms have ensuite bathrooms with walk-in showers.",
    "Wifi is available but intentionally limited — this is a retreat, not a coworking space.",
    "There is a small village 10 minutes' drive away with a pharmacy, supermarket, and café.",
    "Nearest hospital is in Évora, 30 minutes by car. We carry a first aid kit and have emergency procedures.",
    "Currency is Euro (€). Card widely accepted. The venue is cashless.",
    "Portuguese plug sockets (Type F) — UK adapters recommended.",
    "Mobile coverage is good (Vodafone / MEO networks).",
  ],
  meals: {
    overview:
      "All meals are included and prepared by a local chef using seasonal, mostly organic ingredients. We cater to all dietary requirements — please complete the dietary form in your prep materials.",
    schedule: [
      "Breakfast: 8:00-9:00 (continental + hot options)",
      "Lunch: 13:00 (main meal of the day)",
      "Afternoon tea/snacks: 16:00",
      "Dinner: 19:30 (lighter evening meal)",
    ],
    notes:
      "Drinking water, herbal teas, and fruit are available throughout the day. Alcohol is not served but you're welcome to bring your own for evenings.",
  },
};

export function DashboardRetreatDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const navigate = (href: string, opts?: { replace?: boolean }) =>
    opts?.replace ? router.replace(href) : router.push(href);
  const upcomingRetreats = getUpcomingRetreats();

  // In production, look up the booked retreat by id from user's bookings
  // For now, use the mock data (retreat id "1" is the booked one)
  const bookedRetreat = id ? getRetreatById(id) : null;
  const bookedDate = bookedRetreat?.dates.find(
    (d) => d.id === BOOKED_RETREAT.dateId
  );

  const [activeTab, setActiveTab] = useState<
    "overview" | "prep" | "travel" | "schedule" | "community"
  >("overview");
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  if (!bookedRetreat || !bookedDate) {
    return (
      <DashboardLayout title="Retreat Not Found">
        <div className="text-center py-16">
          <Mountain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl mb-2">Retreat not found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find details for this retreat.
          </p>
          <Link href="/dashboard/retreats">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Retreats
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const { fmtDate, fmtDateRange } = useI18n();

  const formatDate = (dateStr: string) =>
    fmtDate(dateStr, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const formatDateShort = (dateStr: string) =>
    fmtDate(dateStr, {
      day: "numeric",
      month: "short",
    });

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "prep" as const, label: "Prep Materials" },
    { key: "travel" as const, label: "Travel Info" },
    { key: "schedule" as const, label: "Daily Schedule" },
    { key: "community" as const, label: "Your Group" },
  ];

  return (
    <DashboardLayout title="Retreats - Private Studio">
      <Link href="/dashboard/retreats"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Retreats
      </Link>

      <h1 className="text-3xl mb-2">{bookedRetreat.title}</h1>
      <p className="text-muted-foreground mb-8">
        Access preparation materials, travel information, and session details
        for your upcoming retreat.
      </p>

      {/* ──── Booked retreat header ──── */}
      <div className="bg-background border-2 border-[#4B5B32] rounded-lg p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-[#4B5B32] text-[#FAFAF8]">
                <Check className="w-3 h-3 mr-1" />
                Booked
              </Badge>
              <span className="text-xs text-muted-foreground">
                Ref: {BOOKED_RETREAT.bookingRef}
              </span>
            </div>
            <h2 className="text-2xl">{bookedRetreat.title}</h2>
            <p className="text-muted-foreground">
              {bookedRetreat.subtitle}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#4B5B32]" />
                {bookedRetreat.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#4B5B32]" />
                {formatDateShort(bookedDate.startDate)} –{" "}
                {formatDateShort(bookedDate.endDate)}
              </span>
            </div>
          </div>
          <div className="text-right space-y-1">
            <p className="text-sm text-muted-foreground">
              {BOOKED_RETREAT.paymentStatus}
            </p>
            <p className="text-lg">
              £{BOOKED_RETREAT.amountPaid.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {BOOKED_RETREAT.roomType}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-t pt-4">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ──── Tab content ──── */}

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Key details */}
            <div className="bg-background border rounded-lg p-6 space-y-4">
              <h3 className="text-lg">Booking Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Dates</span>
                  <span>
                    {formatDate(bookedDate.startDate)} –{" "}
                    {formatDate(bookedDate.endDate)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Location</span>
                  <span>{bookedRetreat.location}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Room type</span>
                  <span>{BOOKED_RETREAT.roomType}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">
                    Dietary notes
                  </span>
                  <span>{BOOKED_RETREAT.dietaryNotes}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">
                    Emergency contact
                  </span>
                  <span>{BOOKED_RETREAT.emergencyContact}</span>
                </div>
              </div>
            </div>

            {/* Countdown & actions */}
            <div className="space-y-4">
              <div className="bg-[#4B5B32]/5 border border-[#4B5B32]/20 rounded-lg p-6 text-center space-y-3">
                <Mountain className="w-8 h-8 text-[#4B5B32] mx-auto" />
                <p className="text-3xl text-[#4B5B32]">
                  {Math.max(
                    0,
                    Math.ceil(
                      (new Date(bookedDate.startDate).getTime() -
                        Date.now()) /
                        86400000
                    )
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  days until your retreat
                </p>
              </div>

              <div className="bg-background border rounded-lg p-6 space-y-3">
                <h3 className="text-lg">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("prep")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Prep Materials
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("travel")}
                  >
                    <Plane className="mr-2 h-4 w-4" />
                    Travel Information
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("schedule")}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Daily Schedule
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("community")}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Your Group
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* What's included */}
          <div className="bg-background border rounded-lg p-6">
            <h3 className="text-lg mb-4">What's Included</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {bookedRetreat.included.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-[#4B5B32] flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PREP MATERIALS */}
      {activeTab === "prep" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-xl">Preparation Materials</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Please complete the essential items before your retreat. Optional
            materials are there to help you prepare — do what feels
            manageable.
          </p>

          {/* Essential */}
          <div>
            <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
              Essential
            </h3>
            <div className="space-y-3">
              {PREP_MATERIALS.filter((m) => m.category === "essential").map(
                (material) => (
                  <div
                    key={material.id}
                    className="bg-background border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 bg-[#4B5B32]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        {material.type === "Form" ? (
                          <ExternalLink className="w-5 h-5 text-[#4B5B32]" />
                        ) : (
                          <Download className="w-5 h-5 text-[#4B5B32]" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm">{material.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {material.description}
                        </p>
                        {material.size && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {material.type} · {material.size}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="flex-shrink-0">
                      {material.type === "Form" ? (
                        <>
                          <ExternalLink className="mr-2 h-3.5 w-3.5" />
                          Open Form
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-3.5 w-3.5" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Optional */}
          <div>
            <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
              Optional
            </h3>
            <div className="space-y-3">
              {PREP_MATERIALS.filter((m) => m.category === "optional").map(
                (material) => (
                  <div
                    key={material.id}
                    className="bg-background border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                        <Download className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm">{material.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {material.description}
                        </p>
                        {material.size && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {material.type} · {material.size}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="flex-shrink-0">
                      <Download className="mr-2 h-3.5 w-3.5" />
                      Download
                    </Button>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="bg-secondary/20 border rounded-lg p-4 text-sm text-muted-foreground italic">
            If you have questions about any of these materials, email{" "}
            <a
              href="mailto:retreats@shrutiturner.com"
              className="text-primary underline not-italic"
            >
              retreats@shrutiturner.com
            </a>
          </div>
        </div>
      )}

      {/* TRAVEL INFO */}
      {activeTab === "travel" && (
        <div className="space-y-8">
          <div className="flex items-center gap-2 mb-2">
            <Plane className="w-5 h-5 text-primary" />
            <h2 className="text-xl">Travel Information</h2>
          </div>

          {/* Venue */}
          <div className="bg-background border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#4B5B32]" />
              <h3 className="text-lg">The Venue</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm">{TRAVEL_INFO.venue.name}</p>
              <p className="text-sm text-muted-foreground">
                {TRAVEL_INFO.venue.address}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                {TRAVEL_INFO.venue.description}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              Open in Maps
            </Button>
          </div>

          {/* Getting there */}
          <div className="bg-background border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-[#4B5B32]" />
              <h3 className="text-lg">Getting There</h3>
            </div>
            <div className="space-y-4">
              {TRAVEL_INFO.gettingThere.map((item, i) => (
                <div key={i} className="border-b last:border-0 pb-4 last:pb-0">
                  <p className="text-sm mb-1">{item.method}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.details}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Weather */}
          <div className="bg-background border rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-[#4B5B32]" />
              <h3 className="text-lg">
                Weather in {TRAVEL_INFO.weather.month}
              </h3>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="text-foreground">Temperature:</span>{" "}
                {TRAVEL_INFO.weather.avgTemp}
              </p>
              <p>{TRAVEL_INFO.weather.conditions}</p>
            </div>
          </div>

          {/* Meals */}
          <div className="bg-background border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-[#4B5B32]" />
              <h3 className="text-lg">Meals</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {TRAVEL_INFO.meals.overview}
            </p>
            <div className="space-y-2">
              {TRAVEL_INFO.meals.schedule.map((meal, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Check className="w-3.5 h-3.5 text-[#4B5B32] flex-shrink-0" />
                  <span>{meal}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground italic">
              {TRAVEL_INFO.meals.notes}
            </p>
          </div>

          {/* Practical notes */}
          <div className="bg-background border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Luggage className="w-5 h-5 text-[#4B5B32]" />
              <h3 className="text-lg">Practical Notes</h3>
            </div>
            <div className="space-y-3">
              {TRAVEL_INFO.practicalNotes.map((note, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-[#4B5B32] flex-shrink-0 mt-0.5">
                    —
                  </span>
                  <span className="text-muted-foreground">{note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DAILY SCHEDULE */}
      {activeTab === "schedule" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-xl">Daily Schedule</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            All sessions are optional. If you need to rest, that's completely
            fine. The schedule is a guide, not a requirement.
          </p>

          <div className="space-y-4">
            {bookedRetreat.schedule.map((day, i) => (
              <div
                key={i}
                className="bg-background border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedDay(
                      expandedDay === day.day ? null : day.day
                    )
                  }
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#4B5B32]/10 rounded-full flex items-center justify-center text-sm text-[#4B5B32]">
                      {i + 1}
                    </div>
                    <span>{day.day}</span>
                  </div>
                  {expandedDay === day.day ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                {expandedDay === day.day && (
                  <div className="px-6 pb-5 pt-1 border-t">
                    <div className="space-y-3 ml-11">
                      {day.activities.map((activity, j) => (
                        <div
                          key={j}
                          className="flex items-start gap-3 text-sm"
                        >
                          <Check className="w-3.5 h-3.5 text-[#4B5B32] flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">
                            {activity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-[#4B5B32]/5 border border-[#4B5B32]/20 rounded-lg p-5 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <Heart className="w-4 h-4 text-[#4B5B32] flex-shrink-0 mt-0.5" />
              <span>
                All sessions are adapted in real time. If you're having a
                difficult day, we'll modify everything to suit you. There is
                no pressure to participate in anything.
              </span>
            </p>
          </div>
        </div>
      )}

      {/* COMMUNITY */}
      {activeTab === "community" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-xl">Your Retreat Group</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Meet the people you'll be sharing this experience with. Names are
            shared with consent only.
          </p>

          {/* Group list */}
          <div className="bg-background border rounded-lg p-6">
            <div className="space-y-4">
              {[
                {
                  name: "You",
                  location: "London",
                  note: "First retreat",
                  isSelf: true,
                },
                {
                  name: "Emma T.",
                  location: "Manchester",
                  note: "Returning guest",
                },
                {
                  name: "Rachel M.",
                  location: "Bristol",
                  note: "First retreat",
                },
                {
                  name: "David K.",
                  location: "Edinburgh",
                  note: "First retreat",
                },
              ].map((person, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 py-3 ${
                    i < 3 ? "border-b" : ""
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${
                      person.isSelf
                        ? "bg-[#B5C49B] text-[#2E1F33]"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {person.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{person.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {person.location}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {person.note}
                  </Badge>
                </div>
              ))}
              <div className="flex items-center gap-4 py-3 text-muted-foreground">
                <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-xs">
                  +4
                </div>
                <p className="text-sm">
                  4 more guests (names shared closer to the retreat)
                </p>
              </div>
            </div>
          </div>

          {/* Group discussion placeholder */}
          <div className="bg-secondary/20 border rounded-lg p-6 text-center space-y-3">
            <Users className="w-8 h-8 text-muted-foreground mx-auto" />
            <h3 className="text-lg">Group Discussion</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              A private group chat will open 2 weeks before the retreat so
              you can introduce yourselves and ask questions. You'll receive
              an email when it's ready.
            </p>
            <p className="text-xs text-muted-foreground italic">
              [Community features require Supabase — placeholder for now]
            </p>
          </div>
        </div>
      )}

      {/* ──── Explore more retreats ──── */}
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-xl mb-4">Explore Other Retreats</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {upcomingRetreats
            .filter((r) => r.id !== BOOKED_RETREAT.retreatId)
            .map((retreat) => (
              <div
                key={retreat.id}
                className="bg-background border rounded-lg p-5 space-y-3"
              >
                <h3 className="text-lg">{retreat.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {retreat.subtitle}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {retreat.location}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg">
                    £{retreat.earlyBirdPrice}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    early bird
                  </span>
                </div>
                <Link href={`/retreats/${retreat.slug}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
