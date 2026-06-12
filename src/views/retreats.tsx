"use client";

import Link from "next/link";
import { ArrowRight, Calendar, MapPin, Users } from "lucide-react";
import { Layout } from "@/components/layout";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  EditorialHero,
  MarketingSection,
  PreFooterCtaSection,
  ProofBand,
  SectionHeading,
  StorySplit,
} from "@/components/marketing/sections";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/use-i18n";
import type { FaqItemContent, RetreatCombinedContent } from "@/lib/content/types";

interface RetreatsPageProps {
  retreats?: RetreatCombinedContent[];
  faqs?: FaqItemContent[];
}

const DEFAULT_RETREAT_FAQS: FaqItemContent[] = [
  {
    slug: "faq-retreats-experience",
    question: "Do I need yoga or strength training experience?",
    answer:
      "No. These retreats are designed for all levels. Everything is adapted to your current capacity and condition. You will receive individualised guidance throughout.",
    sortOrder: 10,
  },
  {
    slug: "faq-retreats-flare",
    question: "What if I am having a flare during the retreat?",
    answer:
      "All sessions are optional and adaptable. If you need to rest, that is completely fine. The retreat environment is designed to be flexible and supportive of fluctuating symptoms.",
    sortOrder: 20,
  },
  {
    slug: "faq-retreats-dietary",
    question: "Can you accommodate dietary requirements?",
    answer:
      "Yes. We cater to dietary requirements and allergies. You will indicate your needs during booking.",
    sortOrder: 30,
  },
  {
    slug: "faq-retreats-cancellation",
    question: "What is the cancellation policy?",
    answer:
      "Full refund if cancelled more than 60 days before retreat. 50% refund 30 to 60 days before. No refund within 30 days unless we can fill your space.",
    sortOrder: 40,
  },
  {
    slug: "faq-retreats-accessibility",
    question: "What if I have specific mobility needs?",
    answer:
      "Please contact us before booking to discuss your needs. We will work to ensure the venue and activities are appropriate where possible.",
    sortOrder: 50,
  },
];

export function RetreatsPage({ retreats, faqs }: RetreatsPageProps) {
  const retreatData = retreats ?? [];
  const retreatFaqs = faqs && faqs.length > 0 ? faqs : DEFAULT_RETREAT_FAQS;
  const { fmtDateRange, fmtDateShort } = useI18n();

  const getStartingPrice = (retreat: RetreatCombinedContent) => {
    const prices = retreat.dates.flatMap((date) =>
      date.roomOptions.map((roomOption) => roomOption.normalPricePence)
    );

    return prices.length > 0 ? Math.min(...prices) : retreat.normalPrice * 100;
  };

  const getStartingDeposit = (retreat: RetreatCombinedContent) => {
    const deposits = retreat.dates.flatMap((date) =>
      date.roomOptions.map((roomOption) =>
        roomOption.depositPence && roomOption.depositPence > 0
          ? roomOption.depositPence
          : Math.min(roomOption.normalPricePence, 30000)
      )
    );

    return deposits.length > 0 ? Math.min(...deposits) : 0;
  };

  const formatMoney = (pence: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(pence / 100);

  return (
    <Layout>
      <EditorialHero
        eyebrow="Retreats"
        size="compact"
        title={
          <>
            Retreats for people who need
            <span className="text-brand-accent-light"> rest with intelligence.</span>
          </>
        }
        description="These are not mainstream wellness retreats. They are small, thoughtful experiences for people who want movement, community and breathing room without being pushed past what their body can realistically hold."
        primaryCta={{ href: "#retreats", label: "View Upcoming Retreats" }}
        secondaryCta={{ href: "/contact", label: "Ask About Accessibility" }}
        stats={[
          { value: "Small", label: "Group sizes and individual attention" },
          { value: "Adaptive", label: "Sessions paced for fluctuating bodies" },
        ]}
        metrics={[
          {
            label: "For",
            detail:
              "People with chronic illness, pain, hypermobility, autoimmune conditions, or injury recovery needs.",
          },
          {
            label: "Includes",
            detail:
              "Movement sessions, community, thoughtful pacing and room to rest without guilt.",
          },
          {
            label: "Difference",
            detail:
              "No pressure to perform wellness. The retreat adapts around real bodies and real energy limits.",
          },
        ]}
        aside={
          <div className="border-brand-white/10 bg-brand-white/8 mx-auto max-w-xl overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
            <div className="aspect-[4/5] overflow-hidden rounded-[1.45rem]">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1732456593210-e2d1570be82b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwcmV0cmVhdCUyMHBvcnR1Z2FsJTIwY291bnRyeXNpZGV8ZW58MXx8fHwxNzcxNTkxNjQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Retreat location for adaptive movement and rest"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="bg-brand-white/10 rounded-[1.15rem] p-4 backdrop-blur-sm">
                <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                  What this feels like
                </p>
                <p className="text-brand-white/84 mt-3 text-sm leading-relaxed">
                  More spacious than a normal class. Less performative than a normal retreat.
                </p>
              </div>
              <div className="bg-brand-accent-light/12 rounded-[1.15rem] p-4 backdrop-blur-sm">
                <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                  What matters
                </p>
                <p className="text-brand-white/84 mt-3 text-sm leading-relaxed">
                  Feeling supported enough to participate and rested enough to recover well.
                </p>
              </div>
            </div>
          </div>
        }
      />

      <ProofBand
        title="What makes these retreats different"
        description="The structure is designed around fluctuating bodies rather than assuming everyone can extract the same amount from every session."
        items={[
          {
            label: "Pacing",
            detail: "Sessions are optional, adaptable andd balanced with genuine downtime.",
          },
          {
            label: "Teaching",
            detail: "Movement is rehabilitation-informed, not generic wellness choreography.",
          },
          {
            label: "Group",
            detail: "Smaller numbers mean more individual attention and less sensory overwhelm.",
          },
          {
            label: "Atmosphere",
            detail:
              "You do not need to hide pain, fatigue, or changing energy levels to belong here.",
          },
        ]}
      />

      <StorySplit
        eyebrow="Retreat Philosophy"
        title="These are not mainstream retreats."
        description="The aim is not to pack the schedule. It is to create a thoughtful container where movement, restand community can all feel safe enough to matter."
        body={
          <div className="space-y-6">
            <p className="text-muted-foreground text-lg leading-relaxed">
              Many retreat spaces quietly reward people who can do the most, stay the longestand
              bounce back the fastest. That is not the standard here.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                "Sessions are adaptable and optional.",
                "Rest is treated as part of the experience, not a sign you are missing it.",
                "Small groups make it easier to adjust without disappearing into the room.",
                "The teaching respects chronic illness, autoimmune conditions and injury recovery rather than asking you to minimise them.",
              ].map((item) => (
                <div key={item} className="marketing-panel rounded-[1.3rem] px-5 py-5">
                  <p className="text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        }
        aside={
          <div className="border-brand-dark/10 bg-brand-warm rounded-[1.8rem] border p-7">
            <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">
              Who tends to come
            </p>
            <div className="mt-5 space-y-4">
              {[
                "People managing autoimmune conditions, arthritis, pain, hypermobility, or fatigue.",
                "People who want a retreat that feels supportive rather than extractive.",
                "People who are tired of being the only one in the room adapting quietly.",
              ].map((item) => (
                <div
                  key={item}
                  className="border-brand-dark/10 bg-background rounded-[1.2rem] border px-5 py-4 text-sm leading-relaxed"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        }
        className="section-divider"
      />

      <MarketingSection className="section-wash" contentClassName="max-w-7xl">
        <SectionHeading
          eyebrow="Upcoming Retreats"
          title="Current dates and locations"
          description="Each retreat has its own atmosphere, but they all share the same commitment to adaptation, pacing and intelligent teaching."
          align="center"
        />

        <div id="retreats" className="mt-12 grid gap-8 md:grid-cols-2">
          {retreatData.map((retreat) => (
            <article
              key={retreat.id}
              className="border-brand-dark/10 bg-background overflow-hidden rounded-[1.9rem] border shadow-[0_22px_55px_rgba(46,31,51,0.06)]"
            >
              <div className="relative aspect-[4/3]">
                <ImageWithFallback
                  src={
                    retreat.slug === "sankalpa"
                      ? "https://images.unsplash.com/photo-1732456593210-e2d1570be82b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwcmV0cmVhdCUyMHBvcnR1Z2FsJTIwY291bnRyeXNpZGV8ZW58MXx8fHwxNzcxNTkxNjQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                      : "https://images.unsplash.com/photo-1762729882448-ac748afc54ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY290dGlzaCUyMGhpZ2hsYW5kcyUyMHdpbnRlciUyMHJldHJlYXR8ZW58MXx8fHwxNzcxNTkxNjQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  }
                  alt={retreat.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-3xl leading-tight">{retreat.title}</h3>
                    <p className="text-muted-foreground mt-3">{retreat.subtitle}</p>
                  </div>
                </div>

                <div className="text-muted-foreground mt-5 flex flex-wrap gap-4 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {retreat.location}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Small group format
                  </span>
                </div>

                <p className="text-muted-foreground mt-5 leading-relaxed">
                  {retreat.shortDescription}
                </p>

                <div className="border-brand-dark/10 bg-brand-warm mt-6 space-y-3 rounded-[1.5rem] border px-5 py-5">
                  {retreat.dates.map((date) => (
                    <div
                      key={date.id}
                      className="border-brand-dark/8 flex flex-col gap-2 border-b pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="inline-flex items-center gap-2 text-sm">
                        <Calendar className="text-brand-accent h-4 w-4" />
                        <span>{fmtDateRange(date.startDate, date.endDate)}</span>
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {date.availableSpaces} / {date.totalSpaces} spaces
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-3xl">{formatMoney(getStartingPrice(retreat))}</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Deposit from {formatMoney(getStartingDeposit(retreat))} · early bird until{" "}
                      {fmtDateShort(retreat.earlyBirdDeadline)}
                    </p>
                  </div>
                  <Button asChild className="bg-brand-dark text-brand-white hover:bg-brand-dark/90">
                    <Link href={`/retreats/${retreat.slug}`}>
                      View retreat details
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection className="bg-brand-warm">
        <SectionHeading
          eyebrow="Questions"
          title="Things people often ask before booking"
          align="center"
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {retreatFaqs.map((faq) => (
            <article
              key={faq.slug}
              className="border-brand-dark/10 bg-background rounded-[1.55rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.05)]"
            >
              <h3 className="text-2xl leading-tight">{faq.question}</h3>
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed">{faq.answer}</p>
            </article>
          ))}
        </div>
      </MarketingSection>

      <PreFooterCtaSection
        eyebrow="Questions"
        title="If you are unsure whether a retreat is suitable for your body, ask."
        description="It is better to have a thoughtful conversation first than force a decision in a space that is meant to feel supportive."
        actions={[
          {
            href: "/contact",
            label: "Send an enquiry",
            icon: ArrowRight,
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
