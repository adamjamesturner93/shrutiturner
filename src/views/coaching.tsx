"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  MessageCircle,
  RefreshCcw,
  UserRound,
} from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { Layout } from "@/components/layout";
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

const coachingFit = [
  {
    title: "Training that can adapt.",
    description:
      "Your programme can change as your strength, confidence, energy, goals or circumstances change, rather than expecting you to follow the same plan regardless.",
    icon: RefreshCcw,
  },
  {
    title: "Structure without rigidity.",
    description:
      "You have a clear direction and something to work towards, without feeling like one missed session or difficult week means you’ve fallen off track.",
    icon: CalendarDays,
  },
  {
    title: "A coach, not just a programme.",
    description:
      "You have someone to help you make decisions, understand what your body is telling you and work out what to change when something isn’t quite working.",
    icon: UserRound,
  },
] as const;

const workingTogether = [
  {
    step: "01",
    title: "We start with you",
    description:
      "We begin with an enquiry, followed by a 30-minute consultation about what you want to achieve, what movement currently looks like for you and anything your training needs to work around.",
  },
  {
    step: "02",
    title: "We build your approach",
    description:
      "I use that information to create a personalised plan around your goals, preferences, experience and real life, with options and adaptations where they’re useful.",
  },
  {
    step: "03",
    title: "We adapt as you go",
    description:
      "Your plan isn’t fixed. We use your feedback, progress and what’s happening in your life to decide what to progress, change or simplify over time.",
  },
] as const;

// Marketing-only prototype. These presentation tiers deliberately do not use the billing catalogue.
const marketingTiers = [
  {
    name: "Monthly Support",
    subtitle: "Monthly review & coaching",
    bestFor: "For people who are happy working independently between planned reviews.",
    price: "£95 / month",
    features: [
      "Personalised training programme across your week.",
      "Monthly programme review and updates.",
      "30-minute coaching call with Shruti each month.",
      "Check-in and feedback through Everfit.",
      "Exercise comments for questions or feedback between reviews.",
    ],
  },
  {
    name: "Weekly Support",
    subtitle: "Weekly review & coaching",
    bestFor: "For people who want more regular review, feedback and support as they train.",
    price: "£130 / month",
    features: [
      "Personalised training programme across your week.",
      "Weekly programme review and updates.",
      "30-minute coaching call with Shruti each month.",
      "Check-in and feedback through Everfit.",
      "Exercise comments for questions or feedback between reviews.",
      "Nutrition guidance.",
    ],
  },
  {
    name: "1:1 Coaching",
    subtitle: "Responsive, collaborative coaching",
    bestFor: "Our most responsive and collaborative level of support.",
    price: "£180 / month",
    features: [
      "Personalised training programme across your week.",
      "Reactive programme adjustments as your needs change.",
      "30-minute coaching call with Shruti each month.",
      "Check-in and feedback through Everfit.",
      "Ongoing direct messaging through Everfit, typically answered within 24 hours.",
      "Nutrition guidance.",
      "More collaborative planning and adaptation.",
    ],
  },
] as const;

const sharedFoundations = [
  "A personalised training programme built around your goals, experience and real life.",
  "Training that can adapt as your body, confidence or circumstances change.",
  "A 30-minute coaching call with Shruti each month.",
  "Regular feedback and check-ins through Everfit.",
  "Clear exercise guidance, options and progressions.",
  "Coaching that considers the context behind your training, not just the exercises.",
] as const;

const faqs = [
  {
    question: "How do I know which level of support is right for me?",
    answer:
      "You do not need to decide before enquiring. The 30-minute consultation gives us space to understand what you need and recommend the most suitable level of support.",
  },
  {
    question: "Why is Everfit part of coaching?",
    answer:
      "Everfit keeps your programme, check-ins and resources easy to find. It is the delivery tool; the coaching relationship, review and decision-making come from Shruti.",
  },
  {
    question: "Is there a minimum commitment?",
    answer:
      "Coaching is billed monthly after the consultation, agreement and payment. Cancellation requires one month's notice; depending on your billing date, the next payment after notice may be your final payment.",
  },
  {
    question: "Can I purchase coaching immediately?",
    answer:
      "No. Start with an enquiry and consultation so the level of support can be recommended before any agreement or payment step.",
  },
] as const;

export function CoachingPage() {
  return (
    <Layout>
      <EditorialHero
        eyebrow="Personal coaching"
        size="compact"
        title={
          <>
            Coaching built around
            <span className="text-brand-accent-light"> your body and your real life.</span>
          </>
        }
        description="Personal training and movement coaching with the structure, conversation and flexibility to adapt as you do."
        primaryCta={{ href: "#is-coaching-right", label: "Explore coaching" }}
        secondaryCta={{ href: "/coaching/enquire", label: "Enquire" }}
        aside={
          <div className="relative mx-auto max-w-xl">
            <div className="border-brand-white/10 bg-brand-white/8 overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <div className="aspect-[4/3] overflow-hidden rounded-[1.45rem]">
                <ImageWithFallback
                  src="/images/shruti-paddleboarding.jpeg"
                  alt="Shruti Turner paddleboarding on a lake"
                  className="h-full w-full object-cover object-[center_54%]"
                />
              </div>
            </div>
          </div>
        }
      />

      <MarketingSection id="is-coaching-right" className="section-wash">
        <SectionHeading
          eyebrow="Is coaching right for me?"
          title="Coaching can help when you want a plan that gives you direction."
          description="You might benefit from coaching if you want support that feels personal, flexible and built around what you actually need."
          align="center"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {coachingFit.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="border-brand-dark/10 bg-background rounded-[1.75rem] border p-7 shadow-[0_20px_50px_rgba(46,31,51,0.05)]"
              >
                <div className="bg-brand-accent/10 text-brand-accent flex h-12 w-12 items-center justify-center rounded-2xl">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-2xl leading-tight">{item.title}</h3>
                <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingSection className="section-divider">
        <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <SectionHeading
              title="Working together"
              description="A clear plan, ongoing conversation and room to adapt when you need it."
            />
            <ol className="mt-9 space-y-5">
              {workingTogether.map((item) => (
                <li
                  key={item.step}
                  className="border-brand-dark/10 bg-background grid gap-4 rounded-[1.55rem] border p-5 sm:grid-cols-[auto_1fr]"
                >
                  <span className="bg-brand-accent text-brand-white flex h-11 w-11 items-center justify-center rounded-full text-sm">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-xl">{item.title}</h3>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="marketing-panel overflow-hidden rounded-[2rem] p-3">
            <div className="aspect-video overflow-hidden rounded-[1.45rem]">
              <ImageWithFallback
                src="/images/shruti-coaching.jpeg"
                alt="Shruti Turner moving outdoors by the sea"
                className="h-full w-full object-cover object-[center_32%]"
              />
            </div>
            <div className="p-5 md:p-6">
              <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">
                The tool, not the service
              </p>
              <h3 className="mt-3 text-2xl">Everything in one place.</h3>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                Your programme, check-ins and resources live in the Everfit app so they stay easy to
                access. Shruti is your coach; Everfit is simply where the work is organised.
              </p>
            </div>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection id="support-levels" className="section-wash" contentClassName="max-w-7xl">
        <SectionHeading
          eyebrow="Levels of support"
          title="The coaching stays personal."
          description="Choose the level of contact that best suits how much guidance, feedback and conversation you want. If you’re unsure, you don’t need to decide before enquiring."
          align="center"
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {marketingTiers.map((tier) => (
            <article
              key={tier.name}
              className="border-brand-dark/10 bg-background relative flex flex-col rounded-[1.9rem] border-2 p-7 shadow-[0_20px_50px_rgba(46,31,51,0.06)]"
            >
              <h3 className="text-3xl">{tier.name}</h3>
              <p className="text-brand-accent mt-2 font-medium">{tier.subtitle}</p>
              <p className="text-muted-foreground mt-4 min-h-16 text-sm leading-relaxed">
                {tier.bestFor}
              </p>
              <p className="mt-6 text-3xl">{tier.price}</p>
              <p className="text-muted-foreground mt-2 text-xs">Consultation before payment</p>
              <ul className="mt-7 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="text-brand-accent mt-0.5 h-4 w-4 shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="mt-7">
                <Link href="/coaching/enquire">
                  <MessageCircle className="h-4 w-4" />
                  Enquire
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection className="bg-brand-warm">
        <SectionHeading
          eyebrow="What Stays the Same"
          title="Every level includes the same quality, personalisation and attention to your individual needs."
          align="center"
        />
        <ul className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
          {sharedFoundations.map((item) => (
            <li
              key={item}
              className="border-brand-dark/10 bg-background flex items-start gap-3 rounded-[1.25rem] border p-5"
            >
              <Check className="text-brand-accent mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="text-muted-foreground leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </MarketingSection>

      <MarketingSection className="section-divider" contentClassName="max-w-4xl">
        <SectionHeading
          eyebrow="Common questions"
          title="The useful details, when you need them."
          description="If your question is not covered here, bring it to the consultation."
          align="center"
        />
        <Accordion type="single" collapsible className="mt-10 rounded-[1.75rem] border px-6">
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.question} value={`faq-${index}`}>
              <AccordionTrigger className="py-6 text-left text-lg">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground max-w-3xl leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </MarketingSection>

      <PreFooterCtaSection
        eyebrow="Start a conversation"
        title="Let’s find the right level of support for you."
        description="You do not need to know which option you need. Tell me what you want help with and we’ll work it out together."
        layout="centered"
        actions={[
          {
            href: "/coaching/enquire",
            label: "Enquire about coaching",
            icon: ArrowRight,
          },
        ]}
      />
    </Layout>
  );
}
