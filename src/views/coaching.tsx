"use client";

import Link from "next/link";
import { ArrowRight, Check, MessageCircle, Youtube } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { Layout } from "@/components/layout";
import {
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
import { useState } from "react";
import { TestimonialQuotes } from "@/components/testimonial-quotes";
import type { TestimonialContent } from "@/lib/content/types";

const coachingFit = [
  {
    title: "Training that can adapt.",
    description:
      "Your programme can change as your strength, confidence, energy, goals or circumstances change, rather than expecting you to follow the same plan regardless.",
    image: "/images/shruti-yoga-warrior.jpeg",
  },
  {
    title: "Structure without rigidity.",
    description:
      "You have a clear direction and something to work towards, without feeling like one missed session or difficult week means you’ve fallen off track.",
    image: "/images/shruti-outdoor-training.jpeg",
  },
  {
    title: "A coach, not just a programme.",
    description:
      "You have someone to help you make decisions, understand what your body is telling you and work out what to change when something isn’t quite working.",
    image: "/images/shruti-coaching.jpeg",
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
      "Monthly programme review and updates.",
      "Exercise comments for questions or feedback between reviews.",
    ],
  },
  {
    name: "Weekly Support",
    subtitle: "Weekly review & coaching",
    bestFor: "For people who want more regular review, feedback and support as they train.",
    price: "£130 / month",
    features: [
      "Weekly programme review and updates.",
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
      "Reactive programme adjustments as your needs change.",
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

export function CoachingPage({ testimonials = [] }: { testimonials?: TestimonialContent[] }) {
  const [activeBenefit, setActiveBenefit] = useState(0);
  const [isIntroVideoPlaying, setIsIntroVideoPlaying] = useState(false);

  return (
    <Layout>
      <section className="bg-brand-dark relative isolate overflow-hidden px-4 py-16 text-white md:py-24">
        <ImageWithFallback
          src="/images/shruti-paddleboarding.jpeg"
          alt=""
          preload
          sizes="100vw"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_25%]"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/65" />
        <div className="mx-auto max-w-4xl py-8 text-center">
          <p className="text-brand-accent-light text-sm tracking-widest uppercase">
            Personal coaching
          </p>
          <h1 className="mt-5 text-4xl leading-tight sm:text-5xl lg:text-6xl">
            Coaching built around your body and your real life.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/90">
            Personal training and movement coaching with the structure, conversation and flexibility
            to adapt as you do.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90"
            >
              <Link href="/coaching/enquire">
                Enquire about coaching <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-black/25 text-white hover:bg-black/50 hover:text-white"
            >
              <a href="#support-levels">Explore support levels</a>
            </Button>
          </div>
        </div>
      </section>

      <MarketingSection id="is-coaching-right" className="section-wash">
        <SectionHeading
          eyebrow="Is coaching right for me?"
          title="Coaching can help when you want a plan that gives you direction."
          description="You might benefit from coaching if you want support that feels personal, flexible and built around what you actually need."
          align="center"
        />
        <div className="mt-10 grid gap-4 md:flex">
          {coachingFit.map((item, index) => (
            <article
              key={item.title}
              className={`bg-brand-dark relative isolate min-w-0 overflow-hidden rounded-[1.75rem] text-white motion-reduce:transition-none md:h-[28rem] md:basis-0 md:transition-[flex-grow] md:duration-700 md:ease-in-out ${activeBenefit === index ? "md:grow-[2]" : "md:grow"}`}
            >
              <ImageWithFallback
                src={item.image}
                alt=""
                loading="lazy"
                className="absolute inset-0 -z-20 h-full w-full object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-gradient-to-t from-black/95 via-black/50 to-black/20"
              />
              <h3>
                <button
                  type="button"
                  aria-pressed={activeBenefit === index}
                  onMouseEnter={() => setActiveBenefit(index)}
                  onFocus={() => setActiveBenefit(index)}
                  onClick={() => setActiveBenefit(index)}
                  className="flex min-h-64 w-full flex-col justify-between p-6 text-left text-2xl focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-white md:h-full md:justify-start"
                >
                  <span
                    aria-hidden="true"
                    className="bg-brand-accent self-start rounded-lg p-3 text-lg"
                  >
                    0{index + 1}
                  </span>
                  <span className="mt-8 md:absolute md:inset-x-6 md:bottom-36">{item.title}</span>
                </button>
              </h3>
              <p
                className={`px-6 pb-6 text-base leading-relaxed motion-reduce:transition-none md:absolute md:bottom-0 md:w-[min(26rem,100%)] md:transition-opacity md:duration-200 ${activeBenefit === index ? "md:opacity-100 md:delay-500" : "md:opacity-0"}`}
              >
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection className="section-wash">
        <div className="bg-background grid items-center gap-6 rounded-[2rem] border p-5 sm:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)] md:gap-10 md:p-8">
          <ImageWithFallback
            src="/images/shruti-coaching.jpeg"
            alt="Shruti outdoors beside the water"
            className="aspect-[4/3] w-full rounded-[1.5rem] object-cover"
            sizes="(max-width: 639px) 100vw, 350px"
          />
          <div>
            <h2 className="text-3xl md:text-4xl">Why Work With Shruti?</h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              My PhD in Rehabilitation sits alongside my experience in personal training, strength
              and conditioning, and yoga. I bring these perspectives together to understand what
              matters to you and build movement and training that fits your body, goals and everyday
              life.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/about">
                Meet Shruti
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection className="section-divider">
        <div className="mx-auto max-w-6xl">
          <div>
            <SectionHeading
              title="Working together"
              description="A clear plan, ongoing conversation and room to adapt when you need it."
            />
            <ol className="mt-9 grid gap-5 md:grid-cols-3">
              {workingTogether.map((item) => (
                <li
                  key={item.step}
                  className="border-brand-dark/10 bg-background grid gap-4 rounded-[1.55rem] border p-5"
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
        </div>
      </MarketingSection>

      <MarketingSection
        className="section-divider"
        contentClassName="max-w-7xl rounded-[2rem] bg-brand-dark p-7 text-white md:p-12"
      >
        <SectionHeading
          eyebrow="Personal support at every level"
          eyebrowClassName="text-white/80"
          title="Included in every plan"
          align="center"
        />
        <ul className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
          {sharedFoundations.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-[1.25rem] border border-white/15 bg-white/5 p-5"
            >
              <Check
                className="text-brand-accent-light mt-0.5 h-5 w-5 shrink-0"
                aria-hidden="true"
              />
              <span className="leading-relaxed text-white/90">{item}</span>
            </li>
          ))}
        </ul>
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
              <p className="text-muted-foreground mt-5 text-sm">Everything above, with:</p>
              <ul className="mt-4 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="text-brand-accent mt-0.5 h-4 w-4 shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="mt-7">
                <Link
                  href="/coaching/enquire"
                  data-analytics-plan={
                    tier.name === "Monthly Support"
                      ? "monthly"
                      : tier.name === "Weekly Support"
                        ? "weekly"
                        : "one_to_one"
                  }
                >
                  <MessageCircle className="h-4 w-4" />
                  Enquire
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection className="section-wash" contentClassName="max-w-4xl">
        <div className="marketing-panel overflow-hidden rounded-[2rem] p-3">
          <div className="aspect-video overflow-hidden rounded-[1.45rem]">
            {isIntroVideoPlaying ? (
              <iframe
                src="https://www.youtube-nocookie.com/embed/aJdsV7oZMdQ?autoplay=1"
                title="How coaching works with Shruti Turner"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                className="group relative h-full w-full cursor-pointer"
                aria-label="Play video explaining how coaching works"
                data-youtube-id="aJdsV7oZMdQ"
                onClick={() => setIsIntroVideoPlaying(true)}
              >
                <ImageWithFallback
                  src="https://i.ytimg.com/vi/aJdsV7oZMdQ/maxresdefault.jpg"
                  alt=""
                  className="h-full w-full object-contain"
                />
                <span
                  className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/35"
                  aria-hidden="true"
                />
                <span className="bg-brand-dark/90 text-brand-white absolute top-1/2 left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-xl transition-transform group-hover:scale-105">
                  <Youtube className="h-8 w-8" aria-hidden="true" />
                </span>
              </button>
            )}
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
      </MarketingSection>

      {testimonials.length > 0 && (
        <MarketingSection contentClassName="max-w-7xl">
          <TestimonialQuotes testimonials={testimonials} title="What coaching clients say" />
        </MarketingSection>
      )}

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
