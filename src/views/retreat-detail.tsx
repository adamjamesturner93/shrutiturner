"use client";

import { RetreatRoomChoices } from "@/components/retreat-room-choices";
import { selectedRoomSummary } from "@/lib/retreats/room-choice";
import { TestimonialQuotes } from "@/components/testimonial-quotes";
import type { TestimonialContent } from "@/lib/content/types";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, Calendar, Check, Gift, MapPin, X } from "lucide-react";
import { getScheduleDateLabel } from "@/lib/retreats/schedule-sections";
import { RetreatSchedule } from "@/components/retreat-schedule";
import { RetreatVenueMap } from "@/components/retreat-venue-map";
import { RetreatGallery } from "@/components/retreat-gallery";
import { Layout } from "@/components/layout";
import { RetreatBedPreference } from "@/components/retreat-bed-preference";
import { requiresBedPreference, type BedPreference } from "@/lib/retreats/bed-preference";
import { MarkdownContent } from "@/components/markdown-content";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { PublicBreadcrumbs } from "@/components/public-breadcrumbs";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { getRetreatCardImagePosition, getRetreatCardImageSrc } from "@/lib/retreats/images";
import {
  getEffectiveRetreatRatePricePence,
  getRoomPriceDeposit,
  isRetreatEarlyBirdActive,
} from "@/lib/retreats/pricing";
import {
  formatRetreatDate,
  formatRetreatDateTimeRange,
  getRetreatPriceSummary,
  getRetreatRoomOptionPriceSummary,
  getRetreatRoomRatePlans as getRoomRatePlans,
} from "@/lib/retreats/presentation";
import type { RetreatCombinedContent, RetreatRoomOptionContent } from "@/lib/content/types";
import { useI18n } from "@/lib/use-i18n";

interface RetreatDetailPageProps {
  testimonials?: TestimonialContent[];
  retreat?: RetreatCombinedContent | null;
  otherRetreatsAtVenue?: RetreatCombinedContent[];
  initialDateId?: string;
}

function formatMoney(value: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 100 ? 2 : 0,
  }).format(value / 100);
}

function getDefaultGuestCount(roomOption: RetreatRoomOptionContent | null | undefined) {
  if (!roomOption) return 1;
  return getRoomRatePlans(roomOption)[0]?.guestCount || 1;
}

function getRatePlanEarlyBirdEndLabel(ratePlan: ReturnType<typeof getRoomRatePlans>[number]) {
  if (
    !isRetreatEarlyBirdActive({
      earlyBirdPricePence: ratePlan.earlyBirdPricePence,
      earlyBirdEndsAt: ratePlan.earlyBirdEndsAt,
      totalPricePence: ratePlan.totalPricePence,
    }) ||
    !ratePlan.earlyBirdEndsAt
  ) {
    return "";
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(ratePlan.earlyBirdEndsAt));
}

function getRatePlanDeposit(
  roomOption: RetreatRoomOptionContent,
  ratePlan: ReturnType<typeof getRoomRatePlans>[number]
) {
  return getRoomPriceDeposit(roomOption, getEffectiveRetreatRatePricePence(ratePlan));
}

function getEarlyBirdSavingPence(ratePlan: ReturnType<typeof getRoomRatePlans>[number]) {
  if (
    !isRetreatEarlyBirdActive({
      earlyBirdPricePence: ratePlan.earlyBirdPricePence,
      earlyBirdEndsAt: ratePlan.earlyBirdEndsAt,
      totalPricePence: ratePlan.totalPricePence,
    })
  ) {
    return 0;
  }
  return Math.max(ratePlan.totalPricePence - getEffectiveRetreatRatePricePence(ratePlan), 0);
}

function getDefaultRoomOptionId(date: RetreatCombinedContent["dates"][number] | null | undefined) {
  if (!date) return "";
  return (
    date.roomOptions.find((option) => !option.isWaitlistOnly && option.availableSpots > 0)?.id ||
    date.roomOptions[0]?.id ||
    ""
  );
}

function getRoomTypeLabel(roomOption: RetreatRoomOptionContent) {
  if (roomOption.type === "ticket") return "Event ticket";
  if (roomOption.type === "single") return "Private room";
  if (roomOption.type === "shared_private") return "Private room";
  if (roomOption.type === "private") return "Private room";
  if (roomOption.type === "virtual") return "Virtual attendance";
  return "Shared room";
}

function getGuestCountLabel(guestCount: number) {
  if (guestCount === 1) return "Just me";
  if (guestCount === 2) return "Two people";
  return `${guestCount} people`;
}

export function RetreatDetailPage({
  testimonials = [],
  retreat: retreatProp,
  otherRetreatsAtVenue = [],
  initialDateId,
}: RetreatDetailPageProps) {
  const retreat = retreatProp ?? null;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { fmtDate } = useI18n();
  const invalidInitialDate = Boolean(
    initialDateId && !retreat?.dates.some((date) => date.id === initialDateId)
  );
  const firstSelectedDateId = invalidInitialDate
    ? ""
    : initialDateId || retreat?.dates[0]?.id || "";
  const [selectedDateId, setSelectedDateId] = useState(firstSelectedDateId);
  const [selectedRoomId, setSelectedRoomId] = useState(
    (retreat?.dates.find((date) => date.id === firstSelectedDateId)?.eventKind ||
      (retreat?.deliveryMode?.startsWith("online") ? "online_workshop" : "residential_retreat")) ===
      "residential_retreat"
      ? ""
      : getDefaultRoomOptionId(
          retreat?.dates.find((date) => date.id === firstSelectedDateId) || null
        )
  );
  const [selectedGuestCount, setSelectedGuestCount] = useState(1);
  const [bedPreference, setBedPreference] = useState<BedPreference>("double");
  const [bookingVisible, setBookingVisible] = useState(false);
  useEffect(() => {
    const booking = document.getElementById("booking");
    if (!booking) return;
    const observer = new IntersectionObserver(([entry]) => setBookingVisible(entry.isIntersecting));
    observer.observe(booking);
    return () => observer.disconnect();
  }, []);

  const selectedDate = useMemo(
    () => retreat?.dates.find((date) => date.id === selectedDateId) || null,
    [retreat, selectedDateId]
  );

  const selectedRoom =
    selectedDate?.roomOptions.find((roomOption) => roomOption.id === selectedRoomId) || null;
  const selectedRoomRatePlans = useMemo(
    () => (selectedRoom ? getRoomRatePlans(selectedRoom) : []),
    [selectedRoom]
  );

  useEffect(() => {
    if (
      !selectedRoom ||
      selectedRoomRatePlans.some((ratePlan) => ratePlan.guestCount === selectedGuestCount)
    ) {
      return;
    }
    setSelectedGuestCount(getDefaultGuestCount(selectedRoom));
  }, [selectedGuestCount, selectedRoom, selectedRoomRatePlans]);

  const priceSummary = useMemo(
    () =>
      retreat && selectedDate
        ? getRetreatPriceSummary({ dates: [selectedDate], normalPrice: retreat.normalPrice })
        : { lowestPricePence: 0, isFromPrice: false },
    [retreat, selectedDate]
  );

  const depositFromPence = useMemo(() => {
    if (!retreat) return 0;
    const deposits = (selectedDate ? [selectedDate] : []).flatMap((date) =>
      date.roomOptions.flatMap((roomOption) =>
        getRoomRatePlans(roomOption).map((ratePlan) => getRatePlanDeposit(roomOption, ratePlan))
      )
    );
    return deposits.length > 0 ? Math.min(...deposits) : 0;
  }, [retreat, selectedDate]);

  const earlyBirdSummary = useMemo(() => {
    if (!retreat) return null;
    const activeRates = (selectedDate ? [selectedDate] : []).flatMap((date) =>
      date.roomOptions.flatMap((roomOption) =>
        getRoomRatePlans(roomOption).filter((ratePlan) => getEarlyBirdSavingPence(ratePlan) > 0)
      )
    );
    if (activeRates.length === 0) return null;
    return {
      standardPriceFromPence: Math.min(...activeRates.map((ratePlan) => ratePlan.totalPricePence)),
      maximumSavingPence: Math.max(
        ...activeRates.map((ratePlan) => getEarlyBirdSavingPence(ratePlan))
      ),
      endsAt: activeRates
        .map((ratePlan) => ratePlan.earlyBirdEndsAt)
        .filter((value): value is string => Boolean(value))
        .sort()[0],
    };
  }, [retreat, selectedDate]);

  if (!retreat) {
    return (
      <Layout>
        <SEO title="Retreat Not Found - Shruti Turner" noIndex />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl">Retreat not found</h1>
          <p className="text-muted-foreground mt-4">
            This retreat may have moved or is no longer available.
          </p>
          <Button asChild className="mt-6">
            <Link href="/retreats">View retreats</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const selectedEventKind =
    selectedDate?.eventKind ||
    (retreat.deliveryMode === "online_live" || retreat.deliveryMode === "online_on_demand"
      ? "online_workshop"
      : "residential_retreat");
  const isOnlineExperience = selectedEventKind === "online_workshop";
  const isLiveOnlineExperience = selectedEventKind === "online_workshop";
  const requiresAccommodation = selectedEventKind === "residential_retreat";
  const isFullPaymentOnly = selectedDate?.paymentPolicy === "full_payment";
  const experienceLabel = selectedEventKind.includes("workshop") ? "workshop" : "retreat";
  const optionLabel = requiresAccommodation ? "room" : "ticket";
  const selectedRoomAvailable = Boolean(
    selectedRoom && !selectedRoom.isWaitlistOnly && selectedRoom.availableSpots > 0
  );
  const hasMultipleDates = retreat.dates.length > 1;
  const hasMultipleOptions = (selectedDate?.roomOptions.length || 0) > 1;
  const selectedTimezone = selectedDate?.timezone || "Europe/London";
  const selectedVenue = selectedDate?.venue || retreat.venue;
  const selectedLocation = selectedDate?.location || selectedDate?.venueName || retreat.location;
  const bestForCopy =
    retreat.audienceDescription?.trim() ||
    "People who want space to move, learn and explore what works for them, with support and choice built in.";
  const checkoutHref =
    selectedDate && selectedRoom
      ? `/retreats/${retreat.slug}/checkout?date=${selectedDate.id}&room=${selectedRoom.id}&guests=${selectedGuestCount}${requiresBedPreference(selectedRoom, selectedGuestCount) ? `&beds=${bedPreference}` : ""}`
      : `/retreats/${retreat.slug}/checkout`;
  const giftHref =
    selectedDate && selectedRoom
      ? `/retreats/${retreat.slug}/checkout?date=${selectedDate.id}&room=${selectedRoom.id}&guests=${selectedGuestCount}&gift=1${requiresBedPreference(selectedRoom, selectedGuestCount) ? `&beds=${bedPreference}` : ""}`
      : `/retreats/${retreat.slug}/checkout?gift=1`;
  const selectedRate = selectedRoom
    ? getRoomRatePlans(selectedRoom).find((rate) => rate.guestCount === selectedGuestCount)
    : null;
  const selectedDueToday =
    selectedRoom && selectedRate
      ? isFullPaymentOnly
        ? getEffectiveRetreatRatePricePence(selectedRate)
        : getRatePlanDeposit(selectedRoom, selectedRate)
      : null;
  const renderBookingActions = (className: string) => (
    <div className={className}>
      <div className="space-y-3">
        {requiresAccommodation && selectedRoom
          ? (() => {
              const rate = getRoomRatePlans(selectedRoom).find(
                (item) => item.guestCount === selectedGuestCount
              );
              if (!rate) return null;
              const total = getEffectiveRetreatRatePricePence(rate);
              const deposit = isFullPaymentOnly ? total : getRatePlanDeposit(selectedRoom, rate);
              return (
                <div aria-live="polite" className="space-y-1 text-sm">
                  <p className="font-medium">
                    {selectedRoomSummary(selectedRoom, selectedGuestCount, bedPreference).label}
                    <br />
                    {
                      selectedRoomSummary(selectedRoom, selectedGuestCount, bedPreference).bedLabel
                    }{" "}
                    · {selectedGuestCount} {selectedGuestCount === 1 ? "guest" : "guests"}
                  </p>
                  <p>
                    {formatMoney(total, retreat.currency)} total ·{" "}
                    {formatMoney(deposit, retreat.currency)} due today
                  </p>
                  <p className="text-muted-foreground">
                    {formatMoney(Math.max(0, total - deposit), retreat.currency)} remaining balance
                    {selectedDate?.balanceDueAt
                      ? ` · due ${formatRetreatDate(selectedDate.balanceDueAt, selectedTimezone)}`
                      : ""}
                  </p>
                </div>
              );
            })()
          : null}
        {selectedDate && selectedRoomAvailable ? (
          <>
            <Button asChild className="w-full" size="lg">
              <Link href={checkoutHref}>
                {hasMultipleDates ? `Book this ${experienceLabel}` : "Book your place"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={giftHref}>
                Buy as a gift
                <Gift className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </>
        ) : (
          <Button type="button" className="w-full" size="lg" disabled>
            {selectedDate ? `Choose an available ${optionLabel}` : "Choose an available date"}
          </Button>
        )}
      </div>
    </div>
  );
  const heroImageSrc = getRetreatCardImageSrc(retreat);
  const hasEarlyBirdPricing = Boolean(
    selectedDate?.roomOptions.some((roomOption) =>
      getRoomRatePlans(roomOption).some((ratePlan) =>
        isRetreatEarlyBirdActive({
          earlyBirdPricePence: ratePlan.earlyBirdPricePence,
          earlyBirdEndsAt: ratePlan.earlyBirdEndsAt,
          totalPricePence: ratePlan.totalPricePence,
        })
      )
    )
  );
  const renderRoomOption = (roomOption: RetreatRoomOptionContent) => {
    const isSelected = roomOption.id === selectedRoom?.id;
    const unavailable = roomOption.availableSpots <= 0 || roomOption.isWaitlistOnly;
    const firstRatePlan = getRoomRatePlans(roomOption)[0];
    const earlyBirdSavingPence = firstRatePlan ? getEarlyBirdSavingPence(firstRatePlan) : 0;
    const optionPriceSummary = getRetreatRoomOptionPriceSummary(roomOption);
    const content = (
      <div className="flex items-start justify-between gap-3">
        <div>
          <p>
            {roomOption.label}
            {unavailable ? " · Sold out" : ""}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {getRoomTypeLabel(roomOption)} ·{" "}
            {getRoomRatePlans(roomOption).length > 1
              ? "choose guest count"
              : roomOption.guestsIncluded > 1
                ? `for ${roomOption.guestsIncluded} guests`
                : "for one guest"}
          </p>
        </div>
        <div className="text-right">
          <span className="text-sm">
            {optionPriceSummary.isFromPrice ? "From " : ""}
            {formatMoney(optionPriceSummary.lowestPricePence, retreat.currency)}
          </span>
          {firstRatePlan && earlyBirdSavingPence > 0 ? (
            <span className="text-muted-foreground mt-1 block text-xs">
              Save {formatMoney(earlyBirdSavingPence, retreat.currency)} · standard{" "}
              {formatMoney(firstRatePlan.totalPricePence, retreat.currency)}
            </span>
          ) : null}
        </div>
      </div>
    );
    const availabilityClassName =
      roomOption.availableSpots <= 0 || roomOption.isWaitlistOnly ? "opacity-60" : "";

    if (!hasMultipleOptions) {
      return (
        <div
          key={roomOption.id}
          className={`border-brand-dark/10 rounded-[1rem] border p-4 ${availabilityClassName}`}
        >
          {content}
        </div>
      );
    }

    return (
      <button
        key={roomOption.id}
        type="button"
        disabled={unavailable}
        aria-pressed={isSelected}
        onClick={() => {
          setSelectedRoomId(roomOption.id);
          setSelectedGuestCount(getDefaultGuestCount(roomOption));
        }}
        className={`rounded-[1rem] border p-4 text-left transition-colors ${
          isSelected ? "border-brand-accent bg-brand-accent/5" : "hover:bg-secondary/20"
        } ${availabilityClassName}`}
      >
        {content}
      </button>
    );
  };

  return (
    <Layout>
      <SEO
        title={`${retreat.title} - Shruti Turner`}
        description={retreat.shortDescription}
        canonicalUrl={`https://shrutiturner.co.uk/retreats/${retreat.slug}`}
      />

      <section className="marketing-grid overflow-hidden px-4 py-12 text-white md:py-16">
        <div className="container mx-auto max-w-7xl">
          <div className="grid items-center gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10">
            <div>
              <PublicBreadcrumbs
                inverted
                className="mb-7"
                items={[
                  { name: "Home", href: "/" },
                  { name: "Retreats", href: "/retreats" },
                  { name: retreat.title, href: `/retreats/${retreat.slug}` },
                ]}
              />
              <div className="text-brand-accent-light inline-flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                {selectedLocation}
              </div>
              <h1 className="mt-5 text-4xl leading-[1.08] tracking-[-0.03em] md:text-5xl">
                {retreat.title}
              </h1>
              <p className="text-brand-accent-light mt-4 max-w-3xl text-xl leading-relaxed">
                {retreat.subtitle}
              </p>
              <p className="text-brand-white/78 mt-5 max-w-4xl text-base leading-relaxed md:text-lg">
                {retreat.shortDescription}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <span className="border-brand-white/12 bg-brand-white/8 text-brand-white/84 rounded-full border px-4 py-2 text-sm">
                  {priceSummary.isFromPrice ? "From " : ""}
                  {formatMoney(priceSummary.lowestPricePence, retreat.currency)}
                </span>
                {depositFromPence > 0 && !isFullPaymentOnly ? (
                  <span className="border-brand-white/12 bg-brand-white/8 text-brand-white/84 rounded-full border px-4 py-2 text-sm">
                    Deposit from {formatMoney(depositFromPence, retreat.currency)}
                  </span>
                ) : null}
                {selectedDate ? (
                  <span className="border-brand-white/12 bg-brand-white/8 text-brand-white/84 rounded-full border px-4 py-2 text-sm">
                    {formatRetreatDateTimeRange(
                      selectedDate.startDate,
                      selectedDate.endDate,
                      selectedDate.timezone
                    )}
                  </span>
                ) : null}
                {selectedDate && isLiveOnlineExperience ? (
                  <span className="border-brand-white/12 bg-brand-white/8 text-brand-white/84 rounded-full border px-4 py-2 text-sm">
                    Times shown in {selectedTimezone}
                  </span>
                ) : null}
              </div>
              <div className="mt-7 flex flex-col gap-4 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90"
                >
                  <a href="#booking">{hasMultipleDates ? "Choose Your Date" : "Book your place"}</a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-brand-white/25 bg-brand-white/6 text-brand-white hover:bg-brand-white/12 hover:text-brand-white focus-visible:text-brand-white focus-visible:ring-brand-accent-light"
                >
                  <Link href="/contact">Ask a Question</Link>
                </Button>
              </div>
            </div>

            <div className="border-brand-white/10 bg-brand-white/8 overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <div className="grid gap-3 md:grid-cols-[1.08fr_0.92fr]">
                <div className="overflow-hidden rounded-[1.45rem]">
                  <ImageWithFallback
                    src={heroImageSrc}
                    alt={retreat.imageAlt || retreat.title}
                    className="h-full min-h-[20rem] w-full object-cover"
                    preload
                    style={{
                      objectPosition: getRetreatCardImagePosition(
                        heroImageSrc,
                        retreat.imageFocalPoint
                      ),
                    }}
                    sizes="(max-width: 1024px) 100vw, 48vw"
                  />
                </div>
                <div className="grid gap-3">
                  {retreat.atmosphereDescription ? (
                    <div className="bg-brand-white/10 rounded-[1.25rem] p-4 backdrop-blur-sm">
                      <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                        Atmosphere
                      </p>
                      <MarkdownContent className="text-brand-white/84 mt-2 text-sm leading-relaxed">
                        {retreat.atmosphereDescription}
                      </MarkdownContent>
                    </div>
                  ) : null}
                  <div className="bg-brand-accent-light/12 rounded-[1.25rem] p-4 backdrop-blur-sm">
                    <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                      Best for
                    </p>
                    <p className="text-brand-white/84 mt-2 text-sm leading-relaxed">
                      {bestForCopy}
                    </p>
                  </div>
                  {hasEarlyBirdPricing ? (
                    <div className="bg-brand-white/10 rounded-[1.25rem] p-4 backdrop-blur-sm">
                      <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                        Early bird
                      </p>
                      <p className="text-brand-white/84 mt-2 text-sm leading-relaxed">
                        Available until{" "}
                        {fmtDate(earlyBirdSummary?.endsAt || retreat.earlyBirdDeadline)}.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav
        aria-label="Retreat sections"
        className="bg-background/95 sticky top-[4.5rem] z-30 border-b backdrop-blur"
      >
        <div className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-4 py-3 text-sm whitespace-nowrap">
          <a className="py-2 underline-offset-4 hover:underline" href="#overview">
            Overview
          </a>
          <a className="py-2 underline-offset-4 hover:underline" href="#included">
            What’s included
          </a>
          {requiresAccommodation && retreat.accommodation ? (
            <a className="py-2 underline-offset-4 hover:underline" href="#stay">
              Stay &amp; food
            </a>
          ) : null}
          <a className="py-2 underline-offset-4 hover:underline" href="#rhythm">
            {requiresAccommodation ? "Daily rhythm" : "Schedule"}
          </a>
          {testimonials.length ? (
            <a className="py-2 underline-offset-4 hover:underline" href="#reviews">
              Reviews
            </a>
          ) : null}
          <a className="py-2 font-semibold underline-offset-4 hover:underline" href="#booking">
            Book
          </a>
        </div>
      </nav>
      <section id="overview" className="section-wash scroll-mt-40 py-10 md:py-14">
        <div className="container mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-[minmax(0,1fr)_25rem]">
          <div className="space-y-10">
            <div className="marketing-panel rounded-[1.85rem] p-7 md:p-8">
              <MarkdownContent className="text-muted-foreground leading-relaxed">
                {retreat.fullDescription}
              </MarkdownContent>
            </div>

            {retreat.suitableFor.length > 0 ? (
              <div className="border-brand-dark/10 bg-background rounded-[1.85rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
                <h2 className="text-3xl md:text-4xl">Who it&apos;s for</h2>
                <ul className="mt-6 space-y-4">
                  {retreat.suitableFor.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                      <span className="text-muted-foreground leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <section
              id="included"
              className="bg-brand-dark scroll-mt-40 overflow-hidden rounded-[1.85rem] text-white shadow-sm"
            >
              <div className="p-7 md:p-9">
                <p className="mb-3 text-sm tracking-[0.16em] uppercase">Your time away</p>
                <h2 className="text-3xl md:text-4xl">What&apos;s included</h2>
                <ul className="mt-7 grid gap-x-7 gap-y-5 md:grid-cols-2">
                  {retreat.included.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 rounded-full bg-white/15 p-1">
                        <Check aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {retreat.notIncluded.length > 0 && !isOnlineExperience ? (
                <div className="border-t border-white/20 bg-white/5 p-7 md:px-9">
                  <h3 className="mb-4 text-xl">Not included</h3>
                  <ul className="grid gap-3 md:grid-cols-2">
                    {retreat.notIncluded.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <X aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <section
              className="bg-background rounded-2xl border p-6"
              aria-labelledby="host-heading"
            >
              <div className="flex flex-wrap items-center gap-5">
                <ImageWithFallback
                  src="/images/shruti-coaching.jpeg"
                  alt="Shruti Turner"
                  loading="lazy"
                  className="h-24 w-24 rounded-full object-cover"
                />
                <div>
                  <p className="text-brand-accent text-sm">Your host</p>
                  <h2 id="host-heading" className="mt-1 text-2xl">
                    Shruti Turner
                  </h2>
                  <Link
                    href="/about"
                    className="text-brand-accent mt-2 inline-block py-2 underline"
                  >
                    Meet Shruti and explore her approach
                  </Link>
                </div>
              </div>
            </section>

            {requiresAccommodation && retreat.accommodation ? (
              <div className="border-brand-dark/10 bg-background rounded-[1.85rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
                <h2 id="stay" className="scroll-mt-40 text-3xl md:text-4xl">
                  Where you’ll stay
                </h2>
                <p className="text-muted-foreground mt-4 leading-relaxed">
                  {retreat.accommodation}
                </p>
                <div className="mt-6">
                  <RetreatGallery images={retreat.gallery || []} />
                </div>
              </div>
            ) : null}
            {retreat.foodAndDrinkDescription && !isOnlineExperience ? (
              <div className="border-brand-dark/10 bg-background rounded-[1.85rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
                <h2 className="text-3xl md:text-4xl">Food and drink</h2>
                <p className="text-muted-foreground mt-4 leading-relaxed">
                  {retreat.foodAndDrinkDescription}
                </p>
              </div>
            ) : null}

            <div className="border-brand-dark/10 bg-background rounded-[1.85rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
              <h2 id="rhythm" className="scroll-mt-40 text-3xl md:text-4xl">
                {isOnlineExperience
                  ? "Workshop schedule"
                  : requiresAccommodation
                    ? "Daily rhythm"
                    : "What we’ll do"}
              </h2>
              {retreat.scheduleMarkdown ? (
                <RetreatSchedule
                  markdown={retreat.scheduleMarkdown}
                  startDate={selectedDate?.startDate}
                  timezone={selectedTimezone}
                />
              ) : retreat.schedule.length > 0 ? (
                <div className="mt-6 space-y-5">
                  {retreat.schedule.map((day, dayIndex) => (
                    <details
                      open={dayIndex === 0}
                      key={day.day}
                      className="border-brand-dark/10 bg-brand-warm/45 rounded-[1.25rem] border p-5"
                    >
                      <summary className="cursor-pointer">
                        <span className="text-brand-accent block text-xs tracking-[0.16em] uppercase">
                          {getScheduleDateLabel(
                            selectedDate?.startDate,
                            dayIndex,
                            selectedTimezone
                          ) ||
                            day.day ||
                            `Day ${dayIndex + 1}`}
                        </span>
                        <span className="mt-1 block text-xl">{day.title}</span>
                      </summary>
                      {day.subtitle ? (
                        <p className="text-muted-foreground mt-1 text-sm italic">{day.subtitle}</p>
                      ) : null}
                      <ul className="text-muted-foreground mt-4 space-y-4 text-sm leading-relaxed">
                        {day.activities.map((activity, activityIndex) => (
                          <li
                            key={`${activity}-${activityIndex}`}
                            className="flex items-start gap-3"
                          >
                            <span
                              aria-hidden="true"
                              className="bg-brand-accent mt-[0.55rem] h-1.5 w-1.5 flex-shrink-0 rounded-full"
                            />
                            <span>{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground mt-4 leading-relaxed">
                  The detailed schedule is being finalised and will be shared before booking opens.
                </p>
              )}
            </div>

            {retreat.whatToBring && retreat.whatToBring.length > 0 ? (
              <div className="border-brand-dark/10 bg-background rounded-[1.85rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
                <h2 className="text-3xl md:text-4xl">What to bring</h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {retreat.whatToBring.map((item) => (
                    <li key={item} className="text-muted-foreground flex items-start gap-3">
                      <Check className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {selectedVenue && !isOnlineExperience ? (
              <div className="border-brand-dark/10 bg-background rounded-[1.85rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
                <h2 className="text-3xl md:text-4xl">Getting there</h2>
                <RetreatVenueMap venue={selectedVenue} />
                <MarkdownContent className="text-muted-foreground mt-4 leading-relaxed">
                  {selectedVenue.arrivalInformation || selectedVenue.travelInformation || ""}
                </MarkdownContent>
                <div className="text-muted-foreground mt-5 grid gap-5 text-sm leading-relaxed md:grid-cols-2">
                  {selectedVenue.travelByTrain ? (
                    <div>
                      <h3 className="text-foreground text-base">By train</h3>
                      <MarkdownContent className="mt-1">
                        {selectedVenue.travelByTrain}
                      </MarkdownContent>
                    </div>
                  ) : null}
                  {selectedVenue.travelByCar ? (
                    <div>
                      <h3 className="text-foreground text-base">By car</h3>
                      <MarkdownContent className="mt-1">
                        {selectedVenue.travelByCar}
                      </MarkdownContent>
                    </div>
                  ) : null}
                  {selectedVenue.localTransferInformation ? (
                    <div className="md:col-span-2">
                      <h3 className="text-foreground text-base">Local transfer</h3>
                      <MarkdownContent className="mt-1">
                        {selectedVenue.localTransferInformation}
                      </MarkdownContent>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {!requiresAccommodation || !retreat.accommodation ? (
              <RetreatGallery images={retreat.gallery || []} />
            ) : null}

            {otherRetreatsAtVenue.length > 0 ? (
              <div className="border-brand-dark/10 bg-background rounded-[1.85rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
                <h2 className="text-3xl md:text-4xl">Other retreats at this venue</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {otherRetreatsAtVenue.map((other) => (
                    <Link
                      key={other.slug}
                      href={`/retreats/${other.slug}`}
                      className="hover:bg-secondary/20 border-brand-dark/10 rounded-[1.25rem] border p-5 transition-colors"
                    >
                      <h3 className="text-xl">{other.title}</h3>
                      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                        {other.subtitle}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="min-w-0 lg:col-start-2 lg:row-start-1" aria-label="Booking summary">
            <div
              id="booking"
              tabIndex={-1}
              className="bg-background scroll-mt-40 rounded-[1.9rem] border p-6 shadow-lg lg:sticky lg:top-40 lg:has-[details[open]]:static"
            >
              <div className="min-w-0">
                <div className="bg-brand-dark -mx-6 -mt-6 mb-5 rounded-t-[1.9rem] p-6 text-white">
                  <p className="text-sm tracking-[0.16em] uppercase">Book your place</p>
                  <p className="mt-2 text-3xl">
                    From {formatMoney(priceSummary.lowestPricePence, retreat.currency)}
                  </p>
                </div>
                {depositFromPence > 0 && !isFullPaymentOnly ? (
                  <p className="text-muted-foreground mt-2 text-sm">
                    Deposit from {formatMoney(depositFromPence, retreat.currency)}, balance{" "}
                    {selectedDate?.balanceDueAt
                      ? `due ${formatRetreatDate(selectedDate.balanceDueAt, selectedTimezone)}`
                      : "later"}
                  </p>
                ) : isFullPaymentOnly ? (
                  <p className="text-muted-foreground mt-2 text-sm">Full payment at checkout</p>
                ) : null}
                {hasEarlyBirdPricing ? (
                  <p className="text-muted-foreground mt-3 text-sm">
                    Early bird pricing until {fmtDate(retreat.earlyBirdDeadline)}. Standard prices
                    from{" "}
                    {formatMoney(earlyBirdSummary?.standardPriceFromPence || 0, retreat.currency)};
                    save up to{" "}
                    {formatMoney(earlyBirdSummary?.maximumSavingPence || 0, retreat.currency)}.
                  </p>
                ) : null}

                <div className="mt-8">
                  <h3 className="text-lg">{hasMultipleDates ? "Choose your date" : "Date"}</h3>
                  {invalidInitialDate && !selectedDate ? (
                    <div
                      role="alert"
                      className="border-destructive/30 bg-destructive/5 text-foreground mt-4 flex gap-3 rounded-[1rem] border p-4 text-sm"
                    >
                      <AlertCircle
                        aria-hidden="true"
                        className="text-destructive mt-0.5 h-5 w-5 shrink-0"
                      />
                      <p>
                        That date is no longer available. Choose one of the current dates below
                        before booking.
                      </p>
                    </div>
                  ) : null}
                  <div className="mt-4 grid gap-3">
                    {hasMultipleDates || !selectedDate ? (
                      retreat.dates.map((date) => {
                        const isSelected = date.id === selectedDate?.id;
                        return (
                          <button
                            key={date.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => {
                              setSelectedDateId(date.id);
                              const params = new URLSearchParams(searchParams.toString());
                              params.set("date", date.id);
                              router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                              const nextRoomId = getDefaultRoomOptionId(date);
                              const nextRoom =
                                date.roomOptions.find(
                                  (roomOption) => roomOption.id === nextRoomId
                                ) ||
                                date.roomOptions[0] ||
                                null;
                              setSelectedRoomId(
                                (date.eventKind || selectedEventKind) === "residential_retreat"
                                  ? ""
                                  : nextRoomId
                              );
                              setBedPreference("double");
                              setSelectedGuestCount(getDefaultGuestCount(nextRoom));
                            }}
                            className={`rounded-[1rem] border p-4 text-left transition-colors ${
                              isSelected
                                ? "border-brand-accent bg-brand-accent/5"
                                : "hover:bg-secondary/20"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p>
                                  {formatRetreatDateTimeRange(
                                    date.startDate,
                                    date.endDate,
                                    date.timezone
                                  )}
                                </p>
                                <p className="text-muted-foreground mt-1 text-sm">
                                  Limited to {date.totalSpaces} places
                                </p>
                                {isLiveOnlineExperience ? (
                                  <p className="text-muted-foreground mt-1 text-sm">
                                    Times shown in {date.timezone || "Europe/London"}
                                  </p>
                                ) : null}
                              </div>
                              <Calendar className="text-brand-accent h-4 w-4" />
                            </div>
                          </button>
                        );
                      })
                    ) : selectedDate ? (
                      <div className="border-brand-dark/10 rounded-[1rem] border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p>
                              {formatRetreatDateTimeRange(
                                selectedDate.startDate,
                                selectedDate.endDate,
                                selectedDate.timezone
                              )}
                            </p>
                            <p className="text-muted-foreground mt-1 text-sm">
                              Limited to {selectedDate.totalSpaces} places
                            </p>
                            {isLiveOnlineExperience ? (
                              <p className="text-muted-foreground mt-1 text-sm">
                                Times shown in {selectedTimezone}
                              </p>
                            ) : null}
                          </div>
                          <Calendar className="text-brand-accent h-4 w-4" />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {selectedDate ? (
                  <details className="mt-5 rounded-2xl border p-4">
                    <summary className="cursor-pointer font-medium">
                      {hasMultipleOptions ? `Choose your ${optionLabel}` : `Your ${optionLabel}`}
                      <span className="text-muted-foreground mt-1 block text-sm font-normal">
                        {selectedRoom
                          ? selectedRoomSummary(selectedRoom, selectedGuestCount, bedPreference)
                              .label
                          : "Select your place"}
                      </span>
                    </summary>
                    <div className="mt-4 grid gap-3">
                      {requiresAccommodation ? (
                        <RetreatRoomChoices
                          key={selectedDate.id}
                          options={selectedDate.roomOptions}
                          selectedId={selectedRoomId}
                          currency={retreat.currency}
                          guestCount={selectedGuestCount}
                          onGuestCountChange={setSelectedGuestCount}
                          bedPreference={bedPreference}
                          onBedPreferenceChange={setBedPreference}
                          onSelect={(room) => setSelectedRoomId(room?.id || "")}
                        />
                      ) : (
                        selectedDate.roomOptions.map(renderRoomOption)
                      )}
                    </div>
                    {!requiresAccommodation && selectedRoom && selectedRoomRatePlans.length > 1 ? (
                      <div className="mt-5">
                        <p className="text-muted-foreground text-sm">
                          How many people will stay in this room?
                        </p>
                        <div className="mt-3 grid gap-2">
                          {selectedRoomRatePlans.map((ratePlan) => (
                            <button
                              key={ratePlan.guestCount}
                              type="button"
                              aria-pressed={selectedGuestCount === ratePlan.guestCount}
                              onClick={() => setSelectedGuestCount(ratePlan.guestCount)}
                              className={`rounded-[0.9rem] border px-4 py-3 text-left text-sm transition-colors ${
                                selectedGuestCount === ratePlan.guestCount
                                  ? "border-brand-accent bg-brand-accent/5"
                                  : "hover:bg-secondary/20"
                              }`}
                            >
                              <span className="font-medium">
                                {getGuestCountLabel(ratePlan.guestCount)}
                              </span>
                              <span className="text-muted-foreground ml-2">
                                {formatMoney(
                                  getEffectiveRetreatRatePricePence(ratePlan),
                                  retreat.currency
                                )}{" "}
                                total
                              </span>
                              {isRetreatEarlyBirdActive({
                                earlyBirdPricePence: ratePlan.earlyBirdPricePence,
                                earlyBirdEndsAt: ratePlan.earlyBirdEndsAt,
                                totalPricePence: ratePlan.totalPricePence,
                              }) ? (
                                <span className="text-muted-foreground mt-1 block text-xs">
                                  Save{" "}
                                  {formatMoney(getEarlyBirdSavingPence(ratePlan), retreat.currency)}
                                  {" · "}standard{" "}
                                  {formatMoney(ratePlan.totalPricePence, retreat.currency)} ·
                                  available until {getRatePlanEarlyBirdEndLabel(ratePlan)}.
                                </span>
                              ) : null}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </details>
                ) : null}

                {!requiresAccommodation &&
                requiresBedPreference(selectedRoom, selectedGuestCount) ? (
                  <RetreatBedPreference value={bedPreference} onChange={setBedPreference} />
                ) : null}

                <div className="bg-brand-warm/30 mt-5 rounded-2xl border p-4">
                  <h3 className="text-xl">Your booking</h3>
                  {!selectedRoom ? (
                    <p className="text-muted-foreground mt-3 text-sm">
                      Choose your place above to see your total and deposit.
                    </p>
                  ) : null}
                  {renderBookingActions("mt-4")}
                </div>

                <div className="mt-8 border-t pt-6">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/contact">Ask a question about this {experienceLabel}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
      {testimonials.length ? (
        <section id="reviews" className="bg-brand-warm/30 scroll-mt-40 px-4 py-12">
          <div className="mx-auto max-w-7xl">
            <TestimonialQuotes
              testimonials={testimonials}
              title="What Shruti's retreat and workshop guests say"
            />
          </div>
        </section>
      ) : null}
      <div className="h-24 lg:hidden" aria-hidden="true" />
      <div
        hidden={bookingVisible}
        className={`${bookingVisible ? "hidden" : "flex"} bg-background/95 fixed inset-x-0 bottom-0 z-40 items-center justify-between gap-3 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden`}
      >
        <div className="min-w-0 text-sm">
          <p className="font-semibold">
            {selectedRoom &&
            selectedRoomSummary(selectedRoom, selectedGuestCount, bedPreference).pricePence != null
              ? `${formatMoney(selectedRoomSummary(selectedRoom, selectedGuestCount, bedPreference).pricePence!, retreat.currency)} total`
              : `From ${formatMoney(priceSummary.lowestPricePence, retreat.currency)}`}
          </p>
          <p className="text-muted-foreground">
            {selectedDueToday != null
              ? `${formatMoney(selectedDueToday, retreat.currency)} due today`
              : "Find your place"}
          </p>
        </div>
        <Button asChild>
          <a href="#booking">{selectedRoomAvailable ? "Review booking" : "Choose your place"}</a>
        </Button>
      </div>
    </Layout>
  );
}
