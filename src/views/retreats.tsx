"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
import { useI18n } from "@/lib/use-i18n";
import { getRetreatCardImageSrc } from "@/lib/retreats/images";
import {
  getEffectiveRetreatRatePricePence,
  type RetreatRatePlanInput,
} from "@/lib/retreats/pricing";
import type {
  FaqItemContent,
  RetreatCombinedContent,
  RetreatRoomOptionContent,
} from "@/lib/content/types";

interface RetreatsPageProps {
  retreats?: RetreatCombinedContent[];
  faqs?: FaqItemContent[];
}

const DEFAULT_RETREAT_FAQS: FaqItemContent[] = [
  {
    slug: "faq-retreats-experience",
    question: "Do I need yoga or fitness experience?",
    answer:
      "No. You don’t need to be fit, flexible or experienced at yoga to take part. Sessions include different options so you can find an approach that works for you.",
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
    description:
      "Sessions include options and adaptations so you can work with your body, experience and energy on the day.",
  },
  {
    title: "Learn something useful",
    description:
      "Explore movement, strength and wellbeing in a way that helps you understand your body and make more confident choices afterwards.",
  },
  {
    title: "Make space for yourself",
    description:
      "Step away from the usual routine with time to move, rest, reflect, connect or simply enjoy doing something different.",
  },
] as const;

export function RetreatsPage({ retreats, faqs }: RetreatsPageProps) {
  const retreatData = retreats ?? [];
  const retreatFaqs = faqs && faqs.length > 0 ? faqs : DEFAULT_RETREAT_FAQS;
  const { fmtDateRange } = useI18n();
  const heroImageSrc = retreatData[0]
    ? getRetreatCardImageSrc(retreatData[0])
    : "/images/shruti-coaching.jpeg";

  const getRoomRatePlans = (roomOption: RetreatRoomOptionContent): RetreatRatePlanInput[] => {
    if (roomOption.ratePlans?.length) return roomOption.ratePlans;
    return [
      {
        guestCount: roomOption.guestCountPerUnit || roomOption.guestsIncluded || 1,
        totalPricePence: roomOption.normalPricePence,
        earlyBirdPricePence: roomOption.earlyBirdPricePence,
        earlyBirdEndsAt: undefined,
      },
    ];
  };

  const getStartingPrice = (retreat: RetreatCombinedContent) => {
    const prices = retreat.dates.flatMap((date) =>
      date.roomOptions.flatMap((roomOption) =>
        getRoomRatePlans(roomOption).map((ratePlan) => getEffectiveRetreatRatePricePence(ratePlan))
      )
    );

    return prices.length > 0 ? Math.min(...prices) : retreat.normalPrice * 100;
  };

  const formatMoney = (pence: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(pence / 100);

  const getFormatLabel = (retreat: RetreatCombinedContent) => {
    if (retreat.deliveryMode === "online_live" || retreat.dates[0]?.retreatType === "online") {
      return "Live online";
    }
    if (retreat.deliveryMode === "online_on_demand") return "Online";
    if (retreat.deliveryMode === "hybrid") return "Hybrid";
    return retreat.location;
  };

  const getDurationLabel = (retreat: RetreatCombinedContent) => {
    const label = retreat.durationLabel || "";
    const onlineHours = label.match(/^([\d.]+)-hour online workshop$/i);
    if (onlineHours) return `${onlineHours[1]} hours`;
    return label;
  };

  return (
    <Layout>
      <EditorialHero
        eyebrow="RETREATS & WORKSHOPS"
        size="compact"
        title="Space to move, learn and reset."
        description="Small-group retreats and online workshops bringing together movement, strength and wellbeing, with space to explore what works for your body and take something useful back into everyday life."
        primaryCta={{ href: "#retreats", label: "Explore upcoming events" }}
        aside={
          <div className="border-brand-white/10 bg-brand-white/8 mx-auto max-w-xl overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
            <div className="aspect-[4/3] overflow-hidden rounded-[1.45rem]">
              <ImageWithFallback
                src={heroImageSrc}
                alt="A Shruti Turner retreat or online workshop experience"
                className="h-full w-full object-cover"
                preload
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
            </div>
          </div>
        }
      />

      <MarketingSection id="retreats" className="section-wash" contentClassName="max-w-7xl">
        <SectionHeading
          eyebrow="Upcoming experiences"
          title="What’s coming up"
          description="From focused online workshops to full weekends away, each event has its own theme and purpose. Choose an experience below to see what we’ll explore, what to expect and all the practical details."
        />

        <div className="mt-10 grid gap-7 md:grid-cols-2">
          {retreatData.map((retreat) => (
            <article
              key={retreat.id}
              className="border-brand-dark/10 bg-background overflow-hidden rounded-[1.9rem] border shadow-[0_22px_55px_rgba(46,31,51,0.06)]"
            >
              <div className="relative aspect-[4/3]">
                <ImageWithFallback
                  src={getRetreatCardImageSrc(retreat)}
                  alt={retreat.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-7">
                <h3 className="text-3xl leading-tight">{retreat.title}</h3>
                <p className="text-muted-foreground mt-3 leading-relaxed">{retreat.subtitle}</p>
                <p className="text-muted-foreground mt-5 text-sm leading-relaxed">
                  {retreat.dates[0]
                    ? fmtDateRange(retreat.dates[0].startDate, retreat.dates[0].endDate)
                    : "Dates to be announced"}
                  {` · ${getFormatLabel(retreat)}`}
                  {getDurationLabel(retreat) ? ` · ${getDurationLabel(retreat)}` : ""}
                </p>

                <div className="mt-auto flex flex-col gap-5 pt-7 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-3xl">{formatMoney(getStartingPrice(retreat))}</p>
                  </div>
                  <Button
                    asChild
                    variant="link"
                    className="h-auto justify-start p-0 sm:justify-end"
                  >
                    <Link href={`/retreats/${retreat.slug}`}>
                      Explore the{" "}
                      {retreat.experienceType === "online_workshop" ? "workshop" : "retreat"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
          {retreatData.length === 0 ? (
            <div className="border-brand-dark/10 bg-background rounded-[1.75rem] border p-8 md:col-span-2">
              <h3 className="text-2xl">New experiences are being planned.</h3>
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

      <MarketingSection className="section-divider">
        <SectionHeading
          eyebrow="The approach"
          title="More than just a workout. More than just time out"
          description="Retreats and workshops give us more time to explore movement than we usually get in a class or training session. There might be strength, yoga, mobility, walking, reflection or rest, alongside opportunities to understand why we’re doing what we’re doing and how you might use it afterwards."
          align="center"
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {RETREAT_PRINCIPLES.map((principle) => (
            <article
              key={principle.title}
              className="border-brand-dark/10 bg-background rounded-[1.55rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.05)]"
            >
              <h3 className="text-2xl leading-tight">{principle.title}</h3>
              <p className="text-muted-foreground mt-4 leading-relaxed">{principle.description}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 grid gap-5">
          <h3 className="text-center text-2xl leading-tight">Come as you are</h3>
          <p className="text-muted-foreground mx-auto max-w-4xl text-center leading-relaxed">
            You don’t need to be fit, flexible, experienced at yoga or managing a particular health
            condition to take part. My sessions are designed with choice built in. You’re always
            welcome to take an option, take a break or approach something differently. The aim isn’t
            for everyone to do the same thing, but to create an environment where you can explore
            what works for you.
          </p>
        </div>
      </MarketingSection>

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
        description="Join the events list and I’ll let you know when new retreats and workshops are announced, with enough information to decide whether they’re right for you."
        layout="centered"
        compact
        actions={[
          {
            href: "/subscribe",
            label: "Get event updates",
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
