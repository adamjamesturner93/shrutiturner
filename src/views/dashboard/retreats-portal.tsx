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

function getDaysUntil(date: string) {
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86400000));
}

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
  const { fmtDate, fmtDateRange } = useI18n();
  const navigate = (href: string, opts?: { replace?: boolean }) =>
    opts?.replace ? router.replace(href) : router.push(href);
  const upcomingRetreats = getUpcomingRetreats();

  // In production, look up the booked retreat by id from user's bookings
  // For now, use the mock data (retreat id "1" is the booked one)
  const bookedRetreat = id ? getRetreatById(id) : null;
  const bookedDate = bookedRetreat?.dates.find((d) => d.id === BOOKED_RETREAT.dateId);

  const [activeTab, setActiveTab] = useState<
    "overview" | "prep" | "travel" | "schedule" | "community"
  >("overview");
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  if (!bookedRetreat || !bookedDate) {
    return (
      <DashboardLayout title="Retreat Not Found">
        <div className="py-16 text-center">
          <Mountain className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h1 className="mb-2 text-2xl">Retreat not found</h1>
          <p className="text-muted-foreground mb-6">We couldn't find details for this retreat.</p>
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
      <Link
        href="/dashboard/retreats"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Retreats
      </Link>

      <h1 className="mb-2 text-3xl">{bookedRetreat.title}</h1>
      <p className="text-muted-foreground mb-8">
        Access preparation materials, travel information, and session details for your upcoming
        retreat.
      </p>

      {/* ──── Booked retreat header ──── */}
      <div className="bg-background border-brand-accent mb-8 rounded-lg border-2 p-6 md:p-8">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-brand-accent text-brand-white">
                <Check className="mr-1 h-3 w-3" />
                Booked
              </Badge>
              <span className="text-muted-foreground text-xs">
                Ref: {BOOKED_RETREAT.bookingRef}
              </span>
            </div>
            <h2 className="text-2xl">{bookedRetreat.title}</h2>
            <p className="text-muted-foreground">{bookedRetreat.subtitle}</p>
            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <MapPin className="text-brand-accent h-4 w-4" />
                {bookedRetreat.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="text-brand-accent h-4 w-4" />
                {formatDateShort(bookedDate.startDate)} – {formatDateShort(bookedDate.endDate)}
              </span>
            </div>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-muted-foreground text-sm">{BOOKED_RETREAT.paymentStatus}</p>
            <p className="text-lg">£{BOOKED_RETREAT.amountPaid.toLocaleString()}</p>
            <p className="text-muted-foreground text-xs">{BOOKED_RETREAT.roomType}</p>
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
          <div className="grid gap-6 md:grid-cols-2">
            {/* Key details */}
            <div className="bg-background space-y-4 rounded-lg border p-6">
              <h3 className="text-lg">Booking Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b py-2">
                  <span className="text-muted-foreground">Dates</span>
                  <span>
                    {formatDate(bookedDate.startDate)} – {formatDate(bookedDate.endDate)}
                  </span>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span className="text-muted-foreground">Location</span>
                  <span>{bookedRetreat.location}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span className="text-muted-foreground">Room type</span>
                  <span>{BOOKED_RETREAT.roomType}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span className="text-muted-foreground">Dietary notes</span>
                  <span>{BOOKED_RETREAT.dietaryNotes}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Emergency contact</span>
                  <span>{BOOKED_RETREAT.emergencyContact}</span>
                </div>
              </div>
            </div>

            {/* Countdown & actions */}
            <div className="space-y-4">
              <div className="border-brand-accent/20 bg-brand-accent/5 space-y-3 rounded-lg border p-6 text-center">
                <Mountain className="text-brand-accent mx-auto h-8 w-8" />
                <p className="text-brand-accent text-3xl">{getDaysUntil(bookedDate.startDate)}</p>
                <p className="text-muted-foreground text-sm">days until your retreat</p>
              </div>

              <div className="bg-background space-y-3 rounded-lg border p-6">
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
          <div className="bg-background rounded-lg border p-6">
            <h3 className="mb-4 text-lg">What's Included</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {bookedRetreat.included.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
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
          <div className="mb-2 flex items-center gap-2">
            <FileText className="text-primary h-5 w-5" />
            <h2 className="text-xl">Preparation Materials</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Please complete the essential items before your retreat. Optional materials are there to
            help you prepare — do what feels manageable.
          </p>

          {/* Essential */}
          <div>
            <h3 className="text-muted-foreground mb-3 text-sm tracking-wider uppercase">
              Essential
            </h3>
            <div className="space-y-3">
              {PREP_MATERIALS.filter((m) => m.category === "essential").map((material) => (
                <div
                  key={material.id}
                  className="bg-background flex flex-col justify-between gap-4 rounded-lg border p-5 sm:flex-row sm:items-center"
                >
                  <div className="flex flex-1 items-start gap-4">
                    <div className="bg-brand-accent/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                      {material.type === "Form" ? (
                        <ExternalLink className="text-brand-accent h-5 w-5" />
                      ) : (
                        <Download className="text-brand-accent h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm">{material.title}</p>
                      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                        {material.description}
                      </p>
                      {material.size && (
                        <p className="text-muted-foreground mt-1 text-xs">
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
              ))}
            </div>
          </div>

          {/* Optional */}
          <div>
            <h3 className="text-muted-foreground mb-3 text-sm tracking-wider uppercase">
              Optional
            </h3>
            <div className="space-y-3">
              {PREP_MATERIALS.filter((m) => m.category === "optional").map((material) => (
                <div
                  key={material.id}
                  className="bg-background flex flex-col justify-between gap-4 rounded-lg border p-5 sm:flex-row sm:items-center"
                >
                  <div className="flex flex-1 items-start gap-4">
                    <div className="bg-secondary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                      <Download className="text-muted-foreground h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm">{material.title}</p>
                      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                        {material.description}
                      </p>
                      {material.size && (
                        <p className="text-muted-foreground mt-1 text-xs">
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
              ))}
            </div>
          </div>

          <div className="bg-secondary/20 text-muted-foreground rounded-lg border p-4 text-sm italic">
            If you have questions about any of these materials, email{" "}
            <a
              href="mailto:retreats@shrutiturner.com"
              className="text-primary not-italic underline"
            >
              retreats@shrutiturner.com
            </a>
          </div>
        </div>
      )}

      {/* TRAVEL INFO */}
      {activeTab === "travel" && (
        <div className="space-y-8">
          <div className="mb-2 flex items-center gap-2">
            <Plane className="text-primary h-5 w-5" />
            <h2 className="text-xl">Travel Information</h2>
          </div>

          {/* Venue */}
          <div className="bg-background space-y-4 rounded-lg border p-6">
            <div className="flex items-center gap-2">
              <MapPin className="text-brand-accent h-5 w-5" />
              <h3 className="text-lg">The Venue</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm">{TRAVEL_INFO.venue.name}</p>
              <p className="text-muted-foreground text-sm">{TRAVEL_INFO.venue.address}</p>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {TRAVEL_INFO.venue.description}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              Open in Maps
            </Button>
          </div>

          {/* Getting there */}
          <div className="bg-background space-y-4 rounded-lg border p-6">
            <div className="flex items-center gap-2">
              <Plane className="text-brand-accent h-5 w-5" />
              <h3 className="text-lg">Getting There</h3>
            </div>
            <div className="space-y-4">
              {TRAVEL_INFO.gettingThere.map((item, i) => (
                <div key={i} className="border-b pb-4 last:border-0 last:pb-0">
                  <p className="mb-1 text-sm">{item.method}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Weather */}
          <div className="bg-background space-y-3 rounded-lg border p-6">
            <div className="flex items-center gap-2">
              <Thermometer className="text-brand-accent h-5 w-5" />
              <h3 className="text-lg">Weather in {TRAVEL_INFO.weather.month}</h3>
            </div>
            <div className="text-muted-foreground space-y-2 text-sm">
              <p>
                <span className="text-foreground">Temperature:</span> {TRAVEL_INFO.weather.avgTemp}
              </p>
              <p>{TRAVEL_INFO.weather.conditions}</p>
            </div>
          </div>

          {/* Meals */}
          <div className="bg-background space-y-4 rounded-lg border p-6">
            <div className="flex items-center gap-2">
              <Utensils className="text-brand-accent h-5 w-5" />
              <h3 className="text-lg">Meals</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {TRAVEL_INFO.meals.overview}
            </p>
            <div className="space-y-2">
              {TRAVEL_INFO.meals.schedule.map((meal, i) => (
                <div key={i} className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Check className="text-brand-accent h-3.5 w-3.5 flex-shrink-0" />
                  <span>{meal}</span>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-xs italic">{TRAVEL_INFO.meals.notes}</p>
          </div>

          {/* Practical notes */}
          <div className="bg-background space-y-4 rounded-lg border p-6">
            <div className="flex items-center gap-2">
              <Luggage className="text-brand-accent h-5 w-5" />
              <h3 className="text-lg">Practical Notes</h3>
            </div>
            <div className="space-y-3">
              {TRAVEL_INFO.practicalNotes.map((note, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-brand-accent mt-0.5 flex-shrink-0">—</span>
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
          <div className="mb-2 flex items-center gap-2">
            <Clock className="text-primary h-5 w-5" />
            <h2 className="text-xl">Daily Schedule</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            All sessions are optional. If you need to rest, that's completely fine. The schedule is
            a guide, not a requirement.
          </p>

          <div className="space-y-4">
            {bookedRetreat.schedule.map((day, i) => (
              <div key={i} className="bg-background overflow-hidden rounded-lg border">
                <button
                  onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                  className="hover:bg-secondary/20 flex w-full items-center justify-between px-6 py-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-brand-accent/10 text-brand-accent flex h-8 w-8 items-center justify-center rounded-full text-sm">
                      {i + 1}
                    </div>
                    <span>{day.day}</span>
                  </div>
                  {expandedDay === day.day ? (
                    <ChevronUp className="text-muted-foreground h-4 w-4" />
                  ) : (
                    <ChevronDown className="text-muted-foreground h-4 w-4" />
                  )}
                </button>
                {expandedDay === day.day && (
                  <div className="border-t px-6 pt-1 pb-5">
                    <div className="ml-11 space-y-3">
                      {day.activities.map((activity, j) => (
                        <div key={j} className="flex items-start gap-3 text-sm">
                          <Check className="text-brand-accent mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{activity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-muted-foreground border-brand-accent/20 bg-brand-accent/5 rounded-lg border p-5 text-sm">
            <p className="flex items-start gap-2">
              <Heart className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                All sessions are adapted in real time. If you're having a difficult day, we'll
                modify everything to suit you. There is no pressure to participate in anything.
              </span>
            </p>
          </div>
        </div>
      )}

      {/* COMMUNITY */}
      {activeTab === "community" && (
        <div className="space-y-6">
          <div className="mb-2 flex items-center gap-2">
            <Users className="text-primary h-5 w-5" />
            <h2 className="text-xl">Your Retreat Group</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Meet the people you'll be sharing this experience with. Names are shared with consent
            only.
          </p>

          {/* Group list */}
          <div className="bg-background rounded-lg border p-6">
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
                <div key={i} className={`flex items-center gap-4 py-3 ${i < 3 ? "border-b" : ""}`}>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm ${
                      person.isSelf
                        ? "bg-brand-accent-light text-brand-dark"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {person.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{person.name}</p>
                    <p className="text-muted-foreground text-xs">{person.location}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {person.note}
                  </Badge>
                </div>
              ))}
              <div className="text-muted-foreground flex items-center gap-4 py-3">
                <div className="bg-secondary/50 flex h-10 w-10 items-center justify-center rounded-full text-xs">
                  +4
                </div>
                <p className="text-sm">4 more guests (names shared closer to the retreat)</p>
              </div>
            </div>
          </div>

          {/* Group discussion placeholder */}
          <div className="bg-secondary/20 space-y-3 rounded-lg border p-6 text-center">
            <Users className="text-muted-foreground mx-auto h-8 w-8" />
            <h3 className="text-lg">Group Discussion</h3>
            <p className="text-muted-foreground mx-auto max-w-md text-sm">
              A private group chat will open 2 weeks before the retreat so you can introduce
              yourselves and ask questions. You'll receive an email when it's ready.
            </p>
            <p className="text-muted-foreground text-xs italic">
              [Community features require Supabase — placeholder for now]
            </p>
          </div>
        </div>
      )}

      {/* ──── Explore more retreats ──── */}
      <div className="mt-12 border-t pt-8">
        <h2 className="mb-4 text-xl">Explore Other Retreats</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {upcomingRetreats
            .filter((r) => r.id !== BOOKED_RETREAT.retreatId)
            .map((retreat) => (
              <div key={retreat.id} className="bg-background space-y-3 rounded-lg border p-5">
                <h3 className="text-lg">{retreat.title}</h3>
                <p className="text-muted-foreground text-sm">{retreat.subtitle}</p>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5" />
                  {retreat.location}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg">£{retreat.earlyBirdPrice}</span>
                  <span className="text-muted-foreground text-xs">early bird</span>
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
