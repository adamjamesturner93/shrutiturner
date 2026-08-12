"use client";

import { ArrowRight, BookOpen, Dumbbell, Heart, MessageCircle, Youtube } from "lucide-react";
import { Layout } from "@/components/layout";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  EditorialHero,
  MarketingSection,
  PreFooterCtaSection,
  PullQuote,
  SectionHeading,
} from "@/components/marketing/sections";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const foundations = [
  {
    title: "Research",
    body: "PhD-level biomechanics research and postgraduate rehabilitation study shape how I reason about movement, loading and adaptation.",
    icon: BookOpen,
  },
  {
    title: "Coaching",
    body: "Personal training, strength and conditioning, exercise referral and yoga give us practical ways to turn that reasoning into action.",
    icon: Dumbbell,
  },
  {
    title: "Lived experience",
    body: "Living and training with psoriatic arthritis, asthma and hypermobility keeps the work grounded in the reality of fluctuating capacity.",
    icon: Heart,
  },
] as const;

const qualificationGroups = [
  {
    value: "research-rehabilitation",
    title: "Research & rehabilitation",
    intro: "Academic training that informs how I understand movement, recovery and capacity.",
    items: [
      {
        title: "PhD Biomechanics",
        body: "Doctoral research informing how I think about human movement, loading and musculoskeletal behaviour.",
      },
      {
        title: "Postgraduate rehabilitation",
        body: "Rehabilitation study shaping how I approach recovery, capacity building and clinical nuance.",
      },
    ],
  },
  {
    value: "fitness-coaching",
    title: "Fitness & coaching",
    intro: "Professional training for individualised strength, fitness and exercise support.",
    items: [
      {
        title: "Level 4 Personal Trainer",
        body: "Advanced personal training study supporting safe, progressive and individualised programming.",
      },
      {
        title: "Exercise referral and specialist study",
        body: "Training across exercise referral, strength and conditioning, low back pain, nutrition, obesity and diabetes.",
      },
    ],
  },
  {
    value: "yoga-wellbeing",
    title: "Yoga & wellbeing",
    intro:
      "Movement education that brings awareness, adaptability and the wider person into practice.",
    items: [
      {
        title: "650+ hours of yoga training",
        body: "Extensive teacher training with emphasis on anatomy, therapeutic application and adaptive practice.",
      },
      {
        title: "Trauma-informed practice",
        body: "Training that supports choice, agency and a more considered relationship with movement and the body.",
      },
    ],
  },
] as const;

export function AboutPage() {
  return (
    <Layout>
      <EditorialHero
        eyebrow="About Shruti"
        size="compact"
        title={
          <>
            Research-led coaching, shaped by a
            <span className="text-brand-accent-light"> complicated body of my own.</span>
          </>
        }
        description="I bring together research, rehabilitation, fitness and wellbeing to help people move and train in ways that fit their bodies and their real lives. The work is evidence-informed, practical and personal."
        stats={[
          { value: "PhD", label: "Biomechanics research" },
          { value: "Rehab", label: "Postgraduate expertise" },
          { value: "650+", label: "Yoga training hours" },
        ]}
        aside={
          <div className="relative mx-auto max-w-xl">
            <div className="border-brand-white/10 bg-brand-white/8 overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <div className="aspect-[4/5] overflow-hidden rounded-[1.45rem]">
                <ImageWithFallback
                  src="/images/shruti.jpeg"
                  alt="Shruti Turner hiking in the mountains"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        }
      />

      <MarketingSection className="section-wash">
        <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <SectionHeading
            eyebrow="Meet Shruti"
            title="A short introduction, in my own words."
            description="This space is ready for a short video about who I am, how my experience shapes my work and what you can expect from working together."
          />
          <div
            className="border-brand-dark/10 bg-brand-dark text-brand-white flex aspect-video items-center justify-center rounded-[1.75rem] border p-8 text-center shadow-[0_24px_60px_rgba(46,31,51,0.12)]"
            role="img"
            aria-label="Placeholder for Shruti Turner's introduction video"
          >
            <div>
              <div className="bg-brand-accent-light/15 text-brand-accent-light mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <Youtube className="h-8 w-8" aria-hidden="true" />
              </div>
              <p className="mt-5 text-2xl">Introduction video coming soon</p>
              <p className="text-brand-white/65 mt-2 text-sm">
                A short introduction to Shruti and her approach will appear here.
              </p>
            </div>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection className="section-divider">
        <SectionHeading
          eyebrow="Research × Coaching × Lived Experience"
          title="Three perspectives, brought into one practice."
          description="Each matters on its own. The useful part is how they work together."
          align="center"
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {foundations.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="border-brand-dark/10 bg-background rounded-[1.55rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.05)]"
              >
                <div className="bg-brand-accent/10 text-brand-accent flex h-11 w-11 items-center justify-center rounded-2xl">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-2xl">{item.title}</h3>
                <p className="text-muted-foreground mt-3 leading-relaxed">{item.body}</p>
              </article>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingSection className="bg-brand-warm">
        <div className="grid gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-start lg:gap-14">
          <div>
            <SectionHeading
              eyebrow="My Story"
              title="This work became personal while I was finishing my PhD."
              description="A diagnosis of psoriatic arthritis changed how I understood movement, effort, recovery and the limits of generic advice."
            />
            <div className="text-muted-foreground mt-7 space-y-5 leading-relaxed">
              <p>
                Very quickly, the body I had relied on became less predictable. Some days I could
                train well. Some days opening a jar felt like a meaningful task.
              </p>
              <p>
                I tried the routes most people try: generic fitness plans, yoga classes and
                professional help that could not fully account for fluctuating symptoms, pain,
                fatigue and the psychology of not trusting your body.
              </p>
              <p>
                My work grew from building a third route between pushing through and becoming
                perpetually cautious: thoughtful, adaptive training that still treats strength and
                progress as real goals.
              </p>
            </div>
          </div>
          <PullQuote
            quote="Lived experience does not replace evidence. It changes the questions you know to ask."
            attribution="Shruti Turner"
          />
        </div>
      </MarketingSection>

      <MarketingSection className="section-divider">
        <SectionHeading
          eyebrow="Qualifications"
          title="The detail, when you want it."
          description="Open a category to see the training behind my approach."
          align="center"
        />
        <Accordion type="single" collapsible className="mx-auto mt-10 max-w-3xl">
          {qualificationGroups.map((group) => (
            <AccordionItem
              key={group.value}
              value={group.value}
              className="border-brand-dark/10 bg-background mb-3 rounded-[1.2rem] border px-5 shadow-[0_12px_30px_rgba(46,31,51,0.04)]"
            >
              <AccordionTrigger className="text-xl hover:no-underline">
                {group.title}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground mb-5 leading-relaxed">{group.intro}</p>
                <div className="space-y-4">
                  {group.items.map((item) => (
                    <div key={item.title} className="border-brand-dark/8 border-l-2 pl-4">
                      <h3 className="text-base">{item.title}</h3>
                      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </MarketingSection>

      <PreFooterCtaSection
        compact
        layout="centered"
        eyebrow="Work Together"
        title="Ready to find support that fits?"
        description="Explore the coaching options or tell me what you are working towards."
        actions={[
          {
            href: "/coaching",
            label: "Explore coaching",
            icon: ArrowRight,
          },
          {
            href: "/coaching/apply",
            label: "Enquire",
            icon: MessageCircle,
            iconPosition: "start",
            variant: "secondary",
          },
        ]}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Shruti Turner",
            url: "https://shrutiturner.co.uk",
            sameAs: [
              "https://instagram.com/shrutiturner",
              "https://facebook.com/profile.php?id=61556124191934",
            ],
            jobTitle: "Personal Trainer and Yoga Teacher",
            description:
              "Personal movement and fitness coach bringing together biomechanics research, rehabilitation, fitness, wellbeing and lived experience.",
            knowsAbout: [
              "Biomechanics",
              "Rehabilitation",
              "Personal Training",
              "Adaptive Yoga",
              "Strength Training",
              "Pain Science",
              "Hypermobility",
            ],
            hasCredential: [
              {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: "degree",
                name: "PhD Biomechanics",
              },
              {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: "diploma",
                name: "Postgraduate Rehabilitation",
              },
              {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: "certificate",
                name: "650+ Hours Yoga Teacher Training",
              },
              {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: "certificate",
                name: "Level 4 Personal Trainer",
              },
            ],
          }),
        }}
      />
    </Layout>
  );
}
