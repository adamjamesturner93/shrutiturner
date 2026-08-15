"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BedDouble,
  Calendar,
  Check,
  Clock,
  Gift,
  MapPin,
  MonitorPlay,
  X,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { PublicBreadcrumbs } from "@/components/public-breadcrumbs";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { getRetreatCardImageSrc } from "@/lib/retreats/images";
import {
  getEffectiveRetreatRatePricePence,
  isRetreatEarlyBirdActive,
} from "@/lib/retreats/pricing";
import type { RetreatCombinedContent, RetreatRoomOptionContent } from "@/lib/content/types";
import { useI18n } from "@/lib/use-i18n";

interface RetreatDetailPageProps {
  retreat?: RetreatCombinedContent | null;
  otherRetreatsAtVenue?: RetreatCombinedContent[];
}

function formatMoney(value: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value / 100);
}

function getRoomRatePlans(roomOption: RetreatRoomOptionContent) {
  if (roomOption.ratePlans && roomOption.ratePlans.length > 0) {
    return [...roomOption.ratePlans].sort((a, b) => a.guestCount - b.guestCount);
  }
  return [
    {
      guestCount: roomOption.guestsIncluded,
      totalPricePence: roomOption.normalPricePence,
      earlyBirdPricePence: roomOption.earlyBirdPricePence,
      currency: "GBP",
    },
  ];
}

function getDefaultGuestCount(roomOption: RetreatRoomOptionContent | null | undefined) {
  if (!roomOption) return 1;
  return getRoomRatePlans(roomOption)[0]?.guestCount || 1;
}

function getRoomRatePrice(roomOption: RetreatRoomOptionContent, guestCount?: number) {
  const ratePlans = getRoomRatePlans(roomOption);
  const selectedRatePlan =
    ratePlans.find((ratePlan) => ratePlan.guestCount === guestCount) || ratePlans[0];
  if (selectedRatePlan) return getEffectiveRetreatRatePricePence(selectedRatePlan);
  return roomOption.normalPricePence;
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

function getRoomDeposit(roomOption: RetreatRoomOptionContent) {
  if (typeof roomOption.depositPence === "number" && roomOption.depositPence > 0) {
    return roomOption.depositPence;
  }
  if (roomOption.normalPricePence <= 25000) return roomOption.normalPricePence;
  return Math.min(roomOption.normalPricePence, 30000);
}

function getRatePlanDeposit(
  roomOption: RetreatRoomOptionContent,
  ratePlan: ReturnType<typeof getRoomRatePlans>[number]
) {
  const baseDepositPence = getRoomDeposit(roomOption);
  const effectivePricePence = getEffectiveRetreatRatePricePence(ratePlan);
  if (roomOption.normalPricePence > 0 && baseDepositPence > 0) {
    return Math.min(
      effectivePricePence,
      Math.round((effectivePricePence * baseDepositPence) / roomOption.normalPricePence)
    );
  }
  return effectivePricePence;
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
  if (roomOption.type === "single") return "Private room";
  if (roomOption.type === "shared_private") return "Private room for two";
  if (roomOption.type === "virtual") return "Virtual attendance";
  return "Shared room";
}

function getGuestCountLabel(guestCount: number) {
  if (guestCount === 1) return "Just me";
  if (guestCount === 2) return "Two people";
  return `${guestCount} people`;
}

function getScheduleDateLabel(startDate: string | undefined, dayIndex: number) {
  if (!startDate) return "";
  const isoDay = startDate.slice(0, 10);
  const date = new Date(`${isoDay}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return "";
  date.setUTCDate(date.getUTCDate() + dayIndex);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function RetreatDetailPage({
  retreat: retreatProp,
  otherRetreatsAtVenue = [],
}: RetreatDetailPageProps) {
  const retreat = retreatProp ?? null;
  const { fmtDate, fmtDateRange } = useI18n();
  const [selectedDateId, setSelectedDateId] = useState(retreat?.dates[0]?.id || "");
  const [selectedRoomId, setSelectedRoomId] = useState(
    getDefaultRoomOptionId(retreat?.dates[0] || null)
  );
  const [selectedGuestCount, setSelectedGuestCount] = useState(1);

  const selectedDate = useMemo(
    () => retreat?.dates.find((date) => date.id === selectedDateId) || retreat?.dates[0] || null,
    [retreat, selectedDateId]
  );

  const selectedRoom =
    selectedDate?.roomOptions.find((roomOption) => roomOption.id === selectedRoomId) ||
    selectedDate?.roomOptions[0] ||
    null;
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

  const priceFromPence = useMemo(() => {
    if (!retreat) return retreat?.normalPrice ? retreat.normalPrice * 100 : 0;
    const prices = retreat.dates.flatMap((date) =>
      date.roomOptions.flatMap((roomOption) =>
        getRoomRatePlans(roomOption).map((ratePlan) => getEffectiveRetreatRatePricePence(ratePlan))
      )
    );
    return prices.length > 0 ? Math.min(...prices) : retreat.normalPrice * 100;
  }, [retreat]);

  const depositFromPence = useMemo(() => {
    if (!retreat) return 0;
    const deposits = retreat.dates.flatMap((date) =>
      date.roomOptions.flatMap((roomOption) =>
        getRoomRatePlans(roomOption).map((ratePlan) => getRatePlanDeposit(roomOption, ratePlan))
      )
    );
    return deposits.length > 0 ? Math.min(...deposits) : 0;
  }, [retreat]);

  const earlyBirdSummary = useMemo(() => {
    if (!retreat) return null;
    const activeRates = retreat.dates.flatMap((date) =>
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
    };
  }, [retreat]);

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

  const isOnlineExperience =
    retreat.deliveryMode === "online_live" ||
    retreat.deliveryMode === "online_on_demand" ||
    retreat.dates.every((date) => date.retreatType === "online");
  const isFullPaymentOnly =
    retreat.dates.length > 0 &&
    retreat.dates.every((date) => date.paymentPolicy === "full_payment");
  const experienceLabel = isOnlineExperience ? "workshop" : "retreat";
  const optionLabel = isOnlineExperience ? "ticket" : "room";
  const checkoutHref =
    selectedDate && selectedRoom
      ? `/retreats/${retreat.slug}/checkout?date=${selectedDate.id}&room=${selectedRoom.id}&guests=${selectedGuestCount}`
      : `/retreats/${retreat.slug}/checkout`;
  const giftHref =
    selectedDate && selectedRoom
      ? `/retreats/${retreat.slug}/checkout?date=${selectedDate.id}&room=${selectedRoom.id}&guests=${selectedGuestCount}&gift=1`
      : `/retreats/${retreat.slug}/checkout?gift=1`;
  const renderBookingActions = (className: string) => (
    <div className={className}>
      <div className="space-y-3">
        <Button asChild className="w-full" size="lg" disabled={!selectedDate || !selectedRoom}>
          <Link href={checkoutHref}>
            Book this {experienceLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href={giftHref}>
            Buy as a gift
            <Gift className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
  const heroImageSrc = getRetreatCardImageSrc(retreat);
  const hasEarlyBirdPricing = retreat.dates.some((date) =>
    date.roomOptions.some((roomOption) =>
      getRoomRatePlans(roomOption).some((ratePlan) =>
        isRetreatEarlyBirdActive({
          earlyBirdPricePence: ratePlan.earlyBirdPricePence,
          earlyBirdEndsAt: ratePlan.earlyBirdEndsAt,
          totalPricePence: ratePlan.totalPricePence,
        })
      )
    )
  );

  return (
    <Layout>
      <SEO
        title={`${retreat.title} - Shruti Turner`}
        description={retreat.shortDescription}
        canonicalUrl={`https://shrutiturner.co.uk/retreats/${retreat.slug}`}
      />

      <section className="marketing-grid overflow-hidden px-4 py-12 text-white md:py-16">
        <div className="container mx-auto max-w-6xl">
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
                {retreat.location}
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
                  {formatMoney(priceFromPence, retreat.currency)}
                </span>
                {depositFromPence > 0 && !isFullPaymentOnly ? (
                  <span className="border-brand-white/12 bg-brand-white/8 text-brand-white/84 rounded-full border px-4 py-2 text-sm">
                    Deposit from {formatMoney(depositFromPence, retreat.currency)}
                  </span>
                ) : null}
                {selectedDate ? (
                  <span className="border-brand-white/12 bg-brand-white/8 text-brand-white/84 rounded-full border px-4 py-2 text-sm">
                    {fmtDateRange(selectedDate.startDate, selectedDate.endDate)}
                  </span>
                ) : null}
              </div>
              <div className="mt-7 flex flex-col gap-4 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90"
                >
                  <a href="#booking">Choose Your Date</a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-brand-white/25 bg-brand-white/6 text-brand-white hover:bg-brand-white/12"
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
                    alt={retreat.title}
                    className="h-full min-h-[20rem] w-full object-cover"
                    preload
                    sizes="(max-width: 1024px) 100vw, 48vw"
                  />
                </div>
                <div className="grid gap-3">
                  <div className="bg-brand-white/10 rounded-[1.25rem] p-4 backdrop-blur-sm">
                    <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                      Atmosphere
                    </p>
                    <p className="text-brand-white/84 mt-2 text-sm leading-relaxed">
                      Spacious movement with options, reflection & rest, with no expectation that
                      everyone takes the same thing from the day.
                    </p>
                  </div>
                  <div className="bg-brand-accent-light/12 rounded-[1.25rem] p-4 backdrop-blur-sm">
                    <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                      Best for
                    </p>
                    <p className="text-brand-white/84 mt-2 text-sm leading-relaxed">
                      People who want time to explore and understand their body and what movement
                      can look like as the seasons change.
                    </p>
                  </div>
                  {hasEarlyBirdPricing ? (
                    <div className="bg-brand-white/10 rounded-[1.25rem] p-4 backdrop-blur-sm">
                      <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                        Early bird
                      </p>
                      <p className="text-brand-white/84 mt-2 text-sm leading-relaxed">
                        Available until {fmtDate(retreat.earlyBirdDeadline)} where applicable.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-wash py-14 md:py-18">
        <div className="container mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-10">
            <div className="marketing-panel rounded-[1.85rem] p-7 md:p-8">
              <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {retreat.fullDescription}
              </div>
            </div>

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

            <div className="border-brand-dark/10 bg-background rounded-[1.85rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
              <h2 className="text-3xl md:text-4xl">What&apos;s included</h2>
              <div
                className={`mt-6 grid gap-8 ${
                  retreat.notIncluded.length > 0 && !isOnlineExperience ? "md:grid-cols-2" : ""
                }`}
              >
                <div>
                  <ul className="space-y-3">
                    {retreat.included.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <Check className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {retreat.notIncluded.length > 0 && !isOnlineExperience ? (
                  <div>
                    <h3 className="mb-4 text-xl">Not included</h3>
                    <ul className="space-y-3">
                      {retreat.notIncluded.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <X className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-brand-dark/10 bg-background rounded-[1.85rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
              <h2 className="text-3xl md:text-4xl">
                {isOnlineExperience ? "Workshop schedule" : "Daily rhythm"}
              </h2>
              {retreat.schedule.length > 0 ? (
                <div className="mt-6 space-y-5">
                  {retreat.schedule.map((day, dayIndex) => (
                    <div
                      key={day.day}
                      className="border-brand-dark/10 bg-brand-warm/45 rounded-[1.25rem] border p-5"
                    >
                      <p className="text-brand-accent text-xs tracking-[0.16em] uppercase">
                        {getScheduleDateLabel(selectedDate?.startDate, dayIndex) || day.day}
                      </p>
                      <h3 className="mt-1 text-xl">{day.title || day.day}</h3>
                      <ul className="text-muted-foreground mt-4 space-y-4 text-sm leading-relaxed">
                        {(day.items?.length ? day.items : day.activities).map((activity) => {
                          const key =
                            typeof activity === "string"
                              ? activity
                              : `${activity.startTime}-${activity.title}`;
                          return (
                            <li key={key} className="flex items-start gap-3">
                              <Clock className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                              {typeof activity === "string" ? (
                                <span>{activity}</span>
                              ) : (
                                <span>
                                  <span className="text-foreground font-medium">
                                    {activity.startTime}
                                    {activity.endTime ? `-${activity.endTime}` : ""} ·{" "}
                                    {activity.title}
                                    {activity.isOptional &&
                                    !activity.title.toLowerCase().includes("optional")
                                      ? " (optional)"
                                      : ""}
                                  </span>
                                  {activity.description ? (
                                    <span className="mt-1 block">{activity.description}</span>
                                  ) : null}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground mt-4 leading-relaxed">
                  The detailed schedule is being finalised and will be shared before booking opens.
                </p>
              )}
            </div>

            {retreat.foodAndDrinkDescription && !isOnlineExperience ? (
              <div className="border-brand-dark/10 bg-background rounded-[1.85rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
                <h2 className="text-3xl md:text-4xl">Food and drink</h2>
                <p className="text-muted-foreground mt-4 leading-relaxed">
                  {retreat.foodAndDrinkDescription}
                </p>
              </div>
            ) : null}

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

            {retreat.venue && retreat.deliveryMode === "in_person" ? (
              <div className="border-brand-dark/10 bg-background rounded-[1.85rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
                <h2 className="text-3xl md:text-4xl">Getting there</h2>
                <p className="text-muted-foreground mt-4 leading-relaxed">
                  {retreat.venue.arrivalInformation || retreat.venue.travelInformation}
                </p>
                <div className="text-muted-foreground mt-5 grid gap-5 text-sm leading-relaxed md:grid-cols-2">
                  {retreat.venue.travelByTrain ? (
                    <div>
                      <h3 className="text-foreground text-base">By train</h3>
                      <p className="mt-1">{retreat.venue.travelByTrain}</p>
                    </div>
                  ) : null}
                  {retreat.venue.travelByCar ? (
                    <div>
                      <h3 className="text-foreground text-base">By car</h3>
                      <p className="mt-1">{retreat.venue.travelByCar}</p>
                    </div>
                  ) : null}
                  {retreat.venue.localTransferInformation ? (
                    <div className="md:col-span-2">
                      <h3 className="text-foreground text-base">Local transfer</h3>
                      <p className="mt-1">{retreat.venue.localTransferInformation}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {!isOnlineExperience && retreat.accommodation ? (
              <div className="border-brand-dark/10 bg-background rounded-[1.85rem] border p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
                <h2 className="text-3xl md:text-4xl">Accommodation</h2>
                <p className="text-muted-foreground mt-4 leading-relaxed">
                  {retreat.accommodation}
                </p>
              </div>
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

          <aside>
            <div
              id="booking"
              tabIndex={-1}
              className="marketing-panel scroll-mt-24 rounded-[1.9rem] p-6 shadow-sm lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100dvh-7rem)] lg:flex-col lg:overflow-hidden"
            >
              <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2">
                <p className="text-brand-accent text-sm tracking-[0.16em] uppercase">
                  Book this {experienceLabel}
                </p>
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-4xl">{formatMoney(priceFromPence, retreat.currency)}</span>
                  {/* <span className="text-muted-foreground text-sm">from</span> */}
                </div>
                {depositFromPence > 0 && !isFullPaymentOnly ? (
                  <p className="text-muted-foreground mt-2 text-sm">
                    Deposit from {formatMoney(depositFromPence, retreat.currency)}, balance later
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
                  <h3 className="text-lg">Choose your date</h3>
                  <div className="mt-4 grid gap-3">
                    {retreat.dates.map((date) => {
                      const isSelected = date.id === selectedDate?.id;
                      return (
                        <button
                          key={date.id}
                          type="button"
                          onClick={() => {
                            setSelectedDateId(date.id);
                            const nextRoomId = getDefaultRoomOptionId(date);
                            const nextRoom =
                              date.roomOptions.find((roomOption) => roomOption.id === nextRoomId) ||
                              date.roomOptions[0] ||
                              null;
                            setSelectedRoomId(nextRoomId);
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
                              <p>{fmtDateRange(date.startDate, date.endDate)}</p>
                              <p className="text-muted-foreground mt-1 text-sm">
                                Limited to {date.totalSpaces} places
                              </p>
                            </div>
                            <Calendar className="text-brand-accent h-4 w-4" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedDate ? (
                  <div className="mt-8">
                    <h3 className="text-lg">Choose your {optionLabel}</h3>
                    <div className="mt-4 grid gap-3">
                      {selectedDate.roomOptions.map((roomOption) => {
                        const isSelected = roomOption.id === selectedRoom?.id;
                        const firstRatePlan = getRoomRatePlans(roomOption)[0];
                        const earlyBirdSavingPence = firstRatePlan
                          ? getEarlyBirdSavingPence(firstRatePlan)
                          : 0;
                        return (
                          <button
                            key={roomOption.id}
                            type="button"
                            onClick={() => {
                              setSelectedRoomId(roomOption.id);
                              setSelectedGuestCount(getDefaultGuestCount(roomOption));
                            }}
                            className={`rounded-[1rem] border p-4 text-left transition-colors ${
                              isSelected
                                ? "border-brand-accent bg-brand-accent/5"
                                : "hover:bg-secondary/20"
                            } ${roomOption.availableSpots <= 0 || roomOption.isWaitlistOnly ? "opacity-60" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p>{roomOption.label}</p>
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
                                  {formatMoney(getRoomRatePrice(roomOption), retreat.currency)}
                                </span>
                                {firstRatePlan && earlyBirdSavingPence > 0 ? (
                                  <span className="text-muted-foreground mt-1 block text-xs">
                                    Save {formatMoney(earlyBirdSavingPence, retreat.currency)} ·
                                    standard{" "}
                                    {formatMoney(firstRatePlan.totalPricePence, retreat.currency)}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {selectedRoom && selectedRoomRatePlans.length > 1 ? (
                      <div className="mt-5">
                        <p className="text-muted-foreground text-sm">
                          How many people will stay in this room?
                        </p>
                        <div className="mt-3 grid gap-2">
                          {selectedRoomRatePlans.map((ratePlan) => (
                            <button
                              key={ratePlan.guestCount}
                              type="button"
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
                  </div>
                ) : null}

                {renderBookingActions("mt-8 lg:hidden")}

                <div className="mt-8 space-y-3 text-sm">
                  <div className="flex items-start gap-3 rounded-xl border p-4">
                    <AlertCircle className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                    <p className="text-muted-foreground">
                      {isOnlineExperience
                        ? "Your ticket, price and any gifted place are reserved against this workshop date."
                        : "Room choice, deposit and any gifted place are all reserved against this selected retreat date."}
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border p-4">
                    {isOnlineExperience ? (
                      <MonitorPlay className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                    ) : (
                      <BedDouble className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                    )}
                    <p className="text-muted-foreground">
                      {isOnlineExperience
                        ? "Accessibility and online access questions are welcome before you book. Use the contact form if you need to check the online set-up first."
                        : "Accessibility and room questions are welcome before you book. Use the contact form if you need to check suitability first."}
                    </p>
                  </div>
                </div>

                <div className="mt-8 border-t pt-6">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/contact">Ask a question about this {experienceLabel}</Link>
                  </Button>
                </div>
              </div>
              {renderBookingActions(
                "border-brand-dark/10 bg-background/95 -mx-6 -mb-6 mt-4 hidden shrink-0 border-t p-4 shadow-[0_-12px_28px_rgba(46,31,51,0.08)] backdrop-blur-sm lg:block"
              )}
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
