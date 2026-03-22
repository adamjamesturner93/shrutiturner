"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BedDouble,
  Calendar,
  Check,
  Clock,
  Gift,
  MapPin,
  X,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import type { RetreatCombinedContent, RetreatRoomOptionContent } from "@/lib/content";
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

function getRoomPrice(roomOption: RetreatRoomOptionContent) {
  return roomOption.normalPricePence;
}

function getRoomDeposit(roomOption: RetreatRoomOptionContent) {
  if (typeof roomOption.depositPence === "number" && roomOption.depositPence > 0) {
    return roomOption.depositPence;
  }
  if (roomOption.normalPricePence <= 25000) return roomOption.normalPricePence;
  return Math.min(roomOption.normalPricePence, 30000);
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

  const selectedDate = useMemo(
    () => retreat?.dates.find((date) => date.id === selectedDateId) || retreat?.dates[0] || null,
    [retreat, selectedDateId]
  );

  const selectedRoom =
    selectedDate?.roomOptions.find((roomOption) => roomOption.id === selectedRoomId) ||
    selectedDate?.roomOptions[0] ||
    null;

  const priceFromPence = useMemo(() => {
    if (!retreat) return retreat?.normalPrice ? retreat.normalPrice * 100 : 0;
    const prices = retreat.dates.flatMap((date) =>
      date.roomOptions.map((roomOption) => getRoomPrice(roomOption))
    );
    return prices.length > 0 ? Math.min(...prices) : retreat.normalPrice * 100;
  }, [retreat]);

  const depositFromPence = useMemo(() => {
    if (!retreat) return 0;
    const deposits = retreat.dates.flatMap((date) =>
      date.roomOptions.map((roomOption) => getRoomDeposit(roomOption))
    );
    return deposits.length > 0 ? Math.min(...deposits) : 0;
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

  const checkoutHref =
    selectedDate && selectedRoom
      ? `/retreats/${retreat.slug}/checkout?date=${selectedDate.id}&room=${selectedRoom.id}`
      : `/retreats/${retreat.slug}/checkout`;
  const giftHref =
    selectedDate && selectedRoom
      ? `/retreats/${retreat.slug}/checkout?date=${selectedDate.id}&room=${selectedRoom.id}&gift=1`
      : `/retreats/${retreat.slug}/checkout?gift=1`;
  const heroImageSrc =
    retreat.slug === "sankalpa"
      ? "https://images.unsplash.com/photo-1732456593210-e2d1570be82b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwcmV0cmVhdCUyMHBvcnR1Z2FsJTIwY291bnRyeXNpZGV8ZW58MXx8fHwxNzcxNTkxNjQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      : "https://images.unsplash.com/photo-1762729882448-ac748afc54ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY290dGlzaCUyMGhpZ2hsYW5kcyUyMHdpbnRlciUyMHJldHJlYXR8ZW58MXx8fHwxNzcxNTkxNjQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

  return (
    <Layout>
      <SEO
        title={`${retreat.title} - Shruti Turner`}
        description={retreat.shortDescription}
        canonicalUrl={`https://shrutiturner.com/retreats/${retreat.slug}`}
      />

      <section className="marketing-grid overflow-hidden px-4 py-12 text-white md:py-16">
        <div className="container mx-auto max-w-6xl">
          <div className="grid items-center gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10">
            <div>
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
                <span className="rounded-full border border-brand-white/12 bg-brand-white/8 px-4 py-2 text-sm text-brand-white/84">
                  From {formatMoney(priceFromPence, retreat.currency)}
                </span>
                {depositFromPence > 0 ? (
                  <span className="rounded-full border border-brand-white/12 bg-brand-white/8 px-4 py-2 text-sm text-brand-white/84">
                    Deposit from {formatMoney(depositFromPence, retreat.currency)}
                  </span>
                ) : null}
                {selectedDate ? (
                  <span className="rounded-full border border-brand-white/12 bg-brand-white/8 px-4 py-2 text-sm text-brand-white/84">
                    {fmtDateRange(selectedDate.startDate, selectedDate.endDate)}
                  </span>
                ) : null}
              </div>
              <div className="mt-7 flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90">
                  <Link href="#booking">Choose Your Date</Link>
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

            <div className="overflow-hidden rounded-[2rem] border border-brand-white/10 bg-brand-white/8 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <div className="grid gap-3 md:grid-cols-[1.08fr_0.92fr]">
                <div className="overflow-hidden rounded-[1.45rem]">
                  <ImageWithFallback
                    src={heroImageSrc}
                    alt={retreat.title}
                    className="h-full min-h-[20rem] w-full object-cover"
                  />
                </div>
                <div className="grid gap-3">
                  <div className="rounded-[1.25rem] bg-brand-white/10 p-4 backdrop-blur-sm">
                    <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                      Atmosphere
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-brand-white/84">
                      Spacious movement, enough rest, and no expectation that everyone extracts the
                      same thing from the day.
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] bg-brand-accent-light/12 p-4 backdrop-blur-sm">
                    <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                      Best for
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-brand-white/84">
                      People who want movement and community without being pushed past what their
                      body can realistically hold.
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] bg-brand-white/10 p-4 backdrop-blur-sm">
                    <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                      Early bird
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-brand-white/84">
                      Available until {fmtDate(retreat.earlyBirdDeadline)} where applicable.
                    </p>
                  </div>
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

            <div className="rounded-[1.85rem] border border-brand-dark/10 bg-background p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
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

            <div className="rounded-[1.85rem] border border-brand-dark/10 bg-background p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
              <h2 className="text-3xl md:text-4xl">What&apos;s included</h2>
              <div className="mt-6 grid gap-8 md:grid-cols-2">
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
              </div>
            </div>

            <div className="rounded-[1.85rem] border border-brand-dark/10 bg-background p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
              <h2 className="text-3xl md:text-4xl">Daily rhythm</h2>
              <div className="mt-6 space-y-5">
                {retreat.schedule.map((day) => (
                  <div key={day.day} className="rounded-[1.25rem] border border-brand-dark/10 bg-brand-warm/45 p-5">
                    <h3 className="text-xl">{day.day}</h3>
                    <ul className="text-muted-foreground mt-4 space-y-3 text-sm leading-relaxed">
                      {day.activities.map((activity) => (
                        <li key={activity} className="flex items-start gap-3">
                          <Clock className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                          <span>{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.85rem] border border-brand-dark/10 bg-background p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
              <h2 className="text-3xl md:text-4xl">Accommodation</h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">{retreat.accommodation}</p>
            </div>

            {otherRetreatsAtVenue.length > 0 ? (
              <div className="rounded-[1.85rem] border border-brand-dark/10 bg-background p-7 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
                <h2 className="text-3xl md:text-4xl">Other retreats at this venue</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {otherRetreatsAtVenue.map((other) => (
                    <Link
                      key={other.slug}
                      href={`/retreats/${other.slug}`}
                      className="hover:bg-secondary/20 rounded-[1.25rem] border border-brand-dark/10 p-5 transition-colors"
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
            <div id="booking" className="marketing-panel sticky top-24 rounded-[1.9rem] p-6 shadow-sm">
              <p className="text-brand-accent text-sm tracking-[0.16em] uppercase">
                Book this retreat
              </p>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-4xl">{formatMoney(priceFromPence, retreat.currency)}</span>
                <span className="text-muted-foreground text-sm">from</span>
              </div>
              {depositFromPence > 0 ? (
                <p className="text-muted-foreground mt-2 text-sm">
                  Deposit from {formatMoney(depositFromPence, retreat.currency)}, balance later
                </p>
              ) : null}
              <p className="text-muted-foreground mt-3 text-sm">
                Early bird pricing until {fmtDate(retreat.earlyBirdDeadline)} where available.
              </p>

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
                          setSelectedRoomId(getDefaultRoomOptionId(date));
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
                              {date.availableSpaces} places currently available
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
                  <h3 className="text-lg">Choose your room</h3>
                  <div className="mt-4 grid gap-3">
                    {selectedDate.roomOptions.map((roomOption) => {
                      const isSelected = roomOption.id === selectedRoom?.id;
                      return (
                        <button
                          key={roomOption.id}
                          type="button"
                          onClick={() => setSelectedRoomId(roomOption.id)}
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
                                {roomOption.guestsIncluded > 1
                                  ? `for ${roomOption.guestsIncluded} guests`
                                  : "for one guest"}
                              </p>
                            </div>
                            <span className="text-sm">
                              {formatMoney(getRoomPrice(roomOption), retreat.currency)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="mt-8 space-y-3">
                <Button
                  asChild
                  className="w-full"
                  size="lg"
                  disabled={!selectedDate || !selectedRoom}
                >
                  <Link href={checkoutHref}>
                    Choose this retreat
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

              <div className="mt-8 space-y-3 text-sm">
                <div className="flex items-start gap-3 rounded-xl border p-4">
                  <AlertCircle className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    Room choice, deposit, and any gifted place are all reserved against this
                    selected retreat date.
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-xl border p-4">
                  <BedDouble className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    Accessibility and room questions are welcome before you book. Use the contact
                    form if you need to check suitability first.
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t pt-6">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/contact">Ask a question about this retreat</Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
