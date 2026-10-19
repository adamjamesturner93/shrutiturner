"use client";

import { TestimonialQuotes } from "@/components/testimonial-quotes";
import type { TestimonialContent } from "@/lib/content/types";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CalendarDays, Clock3, MapPin, MonitorPlay } from "lucide-react";
import { Layout } from "@/components/layout";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  EditorialHero,
  MarketingSection,
  PreFooterCtaSection,
  SectionHeading,
} from "@/components/marketing/sections";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { getRetreatCardImageSrc, getRetreatCardImagePosition } from "@/lib/retreats/images";
import { getRetreatCardDateLabels, getRetreatPriceSummary } from "@/lib/retreats/presentation";
import type { FaqItemContent, RetreatCombinedContent } from "@/lib/content/types";

interface RetreatsPageProps {
  nextEventDateId?: string;
  testimonials?: TestimonialContent[];
  retreats?: RetreatCombinedContent[];
  faqs?: FaqItemContent[];
}

const DEFAULT_RETREAT_FAQS: FaqItemContent[] = [
  {
    slug: "faq-retreats-experience",
    question: "Do I need yoga or fitness experience?",
    answer:
      "No. You don’t need to be fit, flexible or experienced at yoga or training to take part. Sessions include different options so you can find an approach that works for you.",
    sortOrder: 10,
  },
  {
    slug: "faq-retreats-adapt",
    question: "What if I need to adapt or sit something out?",
    answer:
      "That's completely fine. Choice is built into the way I teach. You can take a different option, pause, rest or choose not to take part in an activity.",
    sortOrder: 20,
  },
  {
    slug: "faq-retreats-accessibility",
    question: "Are your retreats accessible?",
    answer:
      "Accessibility varies between venues and formats, so each event page includes relevant information. If you have a particular access need or would like to talk something through before booking, please get in touch.",
    sortOrder: 30,
  },
  {
    slug: "faq-retreats-formats",
    question: "What’s the difference between a retreat and an online workshop?",
    answer:
      "Retreats are small-group, in-person experiences with more time to step away from everyday life. They combine movement and wellbeing with food, rest and time to slow down, with a mixture of guided sessions and space to do as much or as little as you need. Online workshops are focused live sessions you can join from home. We spend a few hours exploring a particular theme through movement, discussion and practical ideas you can take into everyday life.",
    sortOrder: 40,
  },
  {
    slug: "faq-retreats-included",
    question: "What is included in the price?",
    answer:
      "It depends on the experience. Each event page clearly lists what is included, such as live teaching, resources, accommodation or meals, before you book.",
    sortOrder: 50,
  },
  {
    slug: "faq-retreats-cancellation",
    question: "What happens if I need to cancel?",
    answer:
      "Cancellation terms vary by experience and are shown before checkout. You can also review the refund policy before booking or contact us if your circumstances change.",
    sortOrder: 60,
  },
];

const RETREAT_PRINCIPLES = [
  {
    title: "Move your way",
    image: "/images/shruti-yoga-warrior.jpeg",
    description:
      "Sessions include options so you can work with your body, experience and energy on the day.",
  },
  {
    title: "Learn something useful",
    image: "/images/shruti-gym-training.jpeg",
    description:
      "Explore movement, strength and wellbeing in a way that helps you understand your body and make more confident choices.",
  },
  {
    title: "Make space for yourself",
    image: "/images/shruti-coaching.jpeg",
    description:
      "Step away from the usual routine with time to move, rest, reflect, connect or simply enjoy doing something different.",
  },
  {
    title: "Come as you are",
    image: "/images/shruti-hiking-selfie.jpeg",
    description:
      "You don’t need to be fit, flexible or experienced. Choose the options that feel right for you, take breaks and explore at your own pace.",
  },
] as const;

export function RetreatsPage({
  retreats,
  faqs,
  testimonials = [],
  nextEventDateId,
}: RetreatsPageProps) {
  const [activePrinciple, setActivePrinciple] = useState(0);
  const retreatData = retreats ?? [];
  const retreatFaqs = faqs && faqs.length > 0 ? faqs : DEFAULT_RETREAT_FAQS;

  const formatMoney = (pence: number, currency: string) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(pence / 100);

  const getFormatLabel = (
    retreat: RetreatCombinedContent,
    date: RetreatCombinedContent["dates"][number]
  ) => {
    if (date.eventKind === "online_workshop" || date.retreatType === "online") {
      return "Live online";
    }
    if (retreat.deliveryMode === "online_on_demand") return "Online";
    if (retreat.deliveryMode === "hybrid") return "Hybrid";
    if (
      date.eventKind === "residential_retreat" ||
      retreat.experienceType === "residential_retreat"
    )
      return "Residential retreat";
    if (date.eventKind === "day_retreat" || retreat.experienceType === "day_retreat")
      return "Day retreat";
    if (date.eventKind === "in_person_workshop" || retreat.experienceType === "in_person_workshop")
      return "In-person workshop";
    return "In person";
  };

  const getDurationLabel = (retreat: RetreatCombinedContent) => {
    const label = retreat.durationLabel || "";
    const onlineHours = label.match(/^([\d.]+)-hour online workshop$/i);
    if (onlineHours) return `${onlineHours[1]} hours`;
    return label;
  };
  const eventCards = retreatData
    .flatMap((retreat) => retreat.dates.map((date) => ({ retreat, date })))
    .sort(
      (left, right) =>
        new Date(left.date.startDate).getTime() - new Date(right.date.startDate).getTime() ||
        left.date.id.localeCompare(right.date.id)
    );

  const nextEvent = eventCards.find(({ date }) => date.id === nextEventDateId);

  const nextPrice = nextEvent
    ? getRetreatPriceSummary({
        dates: [
          {
            ...nextEvent.date,
            roomOptions: nextEvent.date.roomOptions.filter(
              (room) => room.availableSpots > 0 && !room.isWaitlistOnly
            ),
          },
        ],
        normalPrice: nextEvent.retreat.normalPrice,
      })
    : null;

  const isWorkshop = (card: (typeof eventCards)[number]) => {
    const kind = card.date.eventKind || card.retreat.experienceType;
    return kind
      ? !["residential_retreat", "day_retreat"].includes(kind)
      : card.date.retreatType === "online" ||
          card.retreat.deliveryMode === "online_live" ||
          card.retreat.deliveryMode === "online_on_demand";
  };
  const eventGroups = [
    {
      id: "retreats",
      title: "Retreats",
      eyebrow: "Time away",
      description:
        "Step away from your usual routine. Explore day retreats and weekends with space for movement, rest and connection.",
      cards: eventCards.filter((card) => !isWorkshop(card)),
    },
    {
      id: "workshops",
      title: "Workshops",
      eyebrow: "Time to explore",
      description:
        "Focused sessions to explore a theme, learn something useful and find what works for your body — online or in person.",
      cards: eventCards.filter(isWorkshop),
    },
  ];

  return (
    <Layout>
      <EditorialHero
        eyebrow="RETREATS & WORKSHOPS"
        size="compact"
        title={
          <>
            Space to
            <span className="text-brand-accent-light"> move, learn</span> and{" "}
            <span className="text-brand-accent-light">reset</span>.
          </>
        }
        description="Small-group retreats and online workshops bringing together movement, strength and wellbeing, with space to explore what works for your body and take something useful back into everyday life."
        primaryCta={{ href: "#retreats", label: "Explore retreats" }}
        secondaryCta={{ href: "#workshops", label: "Explore workshops" }}
        aside={
          <div className="border-brand-white/10 bg-brand-white/8 mx-auto max-w-xl overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
            <div className="aspect-[4/3] overflow-hidden rounded-[1.45rem]">
              <ImageWithFallback
                src="/images/shruti-coaching.jpeg"
                alt="Shruti Turner moving outdoors beside the sea"
                className="h-full w-full object-cover"
                preload
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
            </div>
          </div>
        }
      />

      {nextEvent ? (
        <MarketingSection compact className="section-wash" contentClassName="max-w-7xl">
          <article
            aria-labelledby="next-event-title"
            className="bg-background grid overflow-hidden rounded-[1.75rem] border sm:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)]"
          >
            <ImageWithFallback
              src={getRetreatCardImageSrc(nextEvent.retreat)}
              alt={nextEvent.retreat.imageAlt || nextEvent.retreat.title}
              className="aspect-[2/1] h-full w-full object-cover sm:aspect-auto sm:max-h-72"
              style={{
                objectPosition: getRetreatCardImagePosition(
                  getRetreatCardImageSrc(nextEvent.retreat),
                  nextEvent.retreat.imageFocalPoint
                ),
              }}
              sizes="(max-width: 639px) 100vw, 420px"
            />
            <div className="p-6 md:p-8">
              <p className="text-brand-accent text-xs font-medium tracking-widest uppercase">
                Next Up
              </p>
              <h2 id="next-event-title" className="mt-3 text-2xl md:text-3xl">
                {nextEvent.retreat.title}
              </h2>
              <p className="text-muted-foreground mt-3">
                {
                  getRetreatCardDateLabels(
                    nextEvent.date.startDate,
                    nextEvent.date.endDate,
                    nextEvent.date.timezone
                  )?.dateLabel
                }
              </p>
              <p className="text-muted-foreground mt-2">
                {getFormatLabel(nextEvent.retreat, nextEvent.date)} ·{" "}
                {nextEvent.date.location || nextEvent.retreat.location}
              </p>
              <p className="text-brand-accent mt-2 text-sm">
                Places available: {nextEvent.date.availableSpaces}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <p className="text-xl font-semibold">
                  {nextPrice?.isFromPrice ? (
                    <span className="text-muted-foreground mr-2 text-sm font-normal">From</span>
                  ) : null}
                  {formatMoney(nextPrice!.lowestPricePence, nextEvent.retreat.currency)}
                </p>
                <Button asChild>
                  <Link
                    href={`/retreats/${nextEvent.retreat.slug}?date=${encodeURIComponent(nextEvent.date.id)}`}
                  >
                    View Event
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        </MarketingSection>
      ) : null}

      {eventGroups.map((group) => (
        <MarketingSection
          key={group.id}
          id={group.id}
          className={
            group.id === "retreats" ? "section-wash scroll-mt-24" : "bg-brand-warm/40 scroll-mt-24"
          }
          contentClassName="max-w-7xl"
        >
          <SectionHeading
            eyebrow={group.eyebrow}
            title={group.title}
            description={group.description}
          />

          <div
            className={
              group.cards.length === 1 ? "mt-10 grid gap-7" : "mt-10 grid gap-7 md:grid-cols-2"
            }
          >
            {group.cards.map(({ retreat, date }) => {
              const priceSummary = getRetreatPriceSummary({
                dates: [date],
                normalPrice: retreat.normalPrice,
              });
              const dateLabels = getRetreatCardDateLabels(
                date.startDate,
                date.endDate,
                date.timezone
              );
              const isOnline =
                retreat.deliveryMode === "online_live" ||
                retreat.deliveryMode === "online_on_demand" ||
                date.retreatType === "online";
              const LocationIcon = isOnline ? MonitorPlay : MapPin;
              return (
                <article
                  key={`${retreat.id}-${date.id}`}
                  aria-labelledby={`retreat-title-${retreat.slug}-${date.id}`}
                  className={`border-brand-dark/10 bg-background flex h-full flex-col overflow-hidden rounded-[1.5rem] border shadow-[0_22px_55px_rgba(46,31,51,0.06)] ${group.cards.length === 1 ? "md:grid md:grid-cols-2" : ""}`}
                >
                  <div
                    className={`relative aspect-[16/9] shrink-0 overflow-hidden ${group.cards.length === 1 ? "md:aspect-auto md:h-[26rem]" : ""}`}
                  >
                    <ImageWithFallback
                      src={getRetreatCardImageSrc(retreat)}
                      alt={retreat.imageAlt || retreat.title}
                      className="h-full w-full object-cover"
                      style={{
                        objectPosition: getRetreatCardImagePosition(
                          getRetreatCardImageSrc(retreat),
                          retreat.imageFocalPoint
                        ),
                      }}
                      sizes="(max-width: 767px) 100vw, (max-width: 1280px) 50vw, 640px"
                    />
                    <span className="bg-background text-foreground absolute bottom-4 left-4 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm">
                      {getFormatLabel(retreat, date)}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3
                      id={`retreat-title-${retreat.slug}-${date.id}`}
                      className="text-2xl leading-tight text-balance"
                    >
                      {retreat.title}
                    </h3>
                    <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                      {retreat.subtitle}
                    </p>
                    <dl className="mt-5 space-y-3 text-sm">
                      <div className="flex gap-3">
                        <dt>
                          <CalendarDays
                            aria-hidden="true"
                            className="text-primary mt-0.5 h-4 w-4"
                          />
                          <span className="sr-only">Dates and times</span>
                        </dt>
                        <dd>
                          <p className="font-medium">
                            {dateLabels?.dateLabel || "Dates to be announced"}
                          </p>
                          {dateLabels ? (
                            <p className="text-muted-foreground mt-1 text-xs">
                              {dateLabels.timeLabel}
                            </p>
                          ) : null}
                        </dd>
                      </div>
                      <div className="flex gap-3">
                        <dt>
                          <LocationIcon
                            aria-hidden="true"
                            className="text-primary mt-0.5 h-4 w-4"
                          />
                          <span className="sr-only">Location</span>
                        </dt>
                        <dd>
                          {isOnline ? (
                            "Join from home"
                          ) : (
                            <>
                              {date.venueName ||
                                date.location ||
                                retreat.venueName ||
                                retreat.location}
                              {date.venueName &&
                              date.location &&
                              date.venueName !== date.location ? (
                                <span className="text-muted-foreground"> · {date.location}</span>
                              ) : null}
                            </>
                          )}
                        </dd>
                      </div>
                      {getDurationLabel(retreat) ? (
                        <div className="flex gap-3">
                          <dt>
                            <Clock3 aria-hidden="true" className="text-primary mt-0.5 h-4 w-4" />
                            <span className="sr-only">Duration</span>
                          </dt>
                          <dd>{getDurationLabel(retreat)}</dd>
                        </div>
                      ) : null}
                    </dl>

                    <div className="mt-auto pt-6">
                      <div className="border-brand-dark/10 border-t pt-5">
                        <p className="flex items-baseline gap-2">
                          {priceSummary.isFromPrice ? (
                            <span className="text-muted-foreground text-sm">From</span>
                          ) : null}
                          <span className="text-2xl font-semibold">
                            {formatMoney(priceSummary.lowestPricePence, retreat.currency)}
                          </span>
                        </p>
                      </div>
                      <Button asChild className="mt-4 min-h-11 w-full justify-between rounded-lg">
                        <Link
                          href={`/retreats/${retreat.slug}?date=${encodeURIComponent(date.id)}`}
                        >
                          Explore the {isWorkshop({ retreat, date }) ? "workshop" : "retreat"}
                          <ArrowRight aria-hidden="true" className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
            {group.cards.length === 0 ? (
              <div className="border-brand-dark/10 bg-background rounded-[1.75rem] border p-8 md:col-span-2">
                <h3 className="text-2xl">New {group.id} are being planned.</h3>
                <p className="text-muted-foreground mt-3 leading-relaxed">
                  Join the mailing list to hear when new retreat and workshop dates are announced.
                </p>
                <Button asChild variant="link" className="mt-5 h-auto p-0">
                  <Link href="/subscribe">
                    Join the mailing list
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </MarketingSection>
      ))}

      <MarketingSection className="section-wash section-divider" contentClassName="max-w-7xl">
        <SectionHeading
          eyebrow="Why join me"
          title="Your body. Your pace. Space to be yourself."
          description="Time to explore movement, rest and connection, with the freedom to find what works for you."
        />
        <div
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:flex"
          aria-label="Why join a retreat or workshop"
        >
          {RETREAT_PRINCIPLES.map((principle, index) => (
            <button
              key={principle.title}
              type="button"
              aria-pressed={activePrinciple === index}
              onMouseEnter={() => setActivePrinciple(index)}
              onFocus={() => setActivePrinciple(index)}
              onClick={() => setActivePrinciple(index)}
              className={`focus-visible:outline-brand-accent relative isolate flex min-h-80 min-w-0 flex-col justify-between overflow-hidden rounded-[1.75rem] p-6 text-left text-white focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none lg:h-[28rem] lg:basis-0 lg:transition-[flex-grow] lg:duration-500 ${activePrinciple === index ? "lg:grow-[3]" : "lg:grow"}`}
            >
              <ImageWithFallback
                src={principle.image}
                alt=""
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="absolute inset-0 -z-20 h-full w-full object-cover"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/35 to-black/20"
              />
              <span
                aria-hidden="true"
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl font-semibold ${activePrinciple === index ? "bg-brand-accent" : "bg-black/50"}`}
              >
                0{index + 1}
              </span>
              <span>
                <span
                  className={`mb-4 block leading-relaxed ${activePrinciple === index ? "" : "lg:hidden"}`}
                >
                  {principle.description}
                </span>
                <span className="block text-2xl leading-tight font-semibold">
                  {principle.title}
                </span>
              </span>
            </button>
          ))}
        </div>
      </MarketingSection>

      {testimonials.length ? (
        <MarketingSection contentClassName="max-w-7xl">
          <TestimonialQuotes testimonials={testimonials} />
        </MarketingSection>
      ) : null}
      <MarketingSection className="bg-brand-warm" contentClassName="max-w-4xl">
        <SectionHeading eyebrow="Questions" title="Useful details before you book" align="center" />
        <Accordion type="single" collapsible className="mt-10 rounded-[1.75rem] border px-6">
          {retreatFaqs.map((faq, index) => (
            <AccordionItem key={faq.slug} value={`faq-${index}`}>
              <AccordionTrigger className="py-6 text-left text-lg">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground max-w-3xl leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </MarketingSection>

      <PreFooterCtaSection
        title="Want to hear about new dates?"
        description="Join the newsletter and I’ll let you know when new retreats and workshops are announced, with enough information to decide whether they’re right for you."
        layout="centered"
        compact
        actions={[
          {
            href: "/subscribe",
            label: "Join the newsletter",
            icon: ArrowRight,
          },
          {
            href: "#retreats",
            label: "Explore upcoming events",
            icon: ArrowRight,
            variant: "secondary",
          },
        ]}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: retreatFaqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />
    </Layout>
  );
}
