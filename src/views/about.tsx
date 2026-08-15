"use client";

import { useEffect, useState } from "react";
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
    body: "PhD and further research in biomechanics and rehabilitation shape how I consider movement, loading and adaptation.",
    icon: BookOpen,
  },
  {
    title: "Coaching",
    body: "Personal training, strength and conditioning and yoga give us practical ways to turn theory into tangible steps.",
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
    title: "Research & Rehabilitation",
    items: [
      "PhD Rehabilitation, Imperial College London",
      "MSc Biomedical Engineering, University of Southampton",
    ],
  },
  {
    value: "fitness-coaching",
    title: "Fitness & Coaching",
    items: [
      "Level 4 Strength & Conditioning",
      "Level 3 Personal Trainer",
      "Specialist courses: Level 3s Exercise Referral, Pre/Post Natal; Level 4s Nutrition for Athletic Performance, Low Back Pain, Obesity, Diabetes",
    ],
  },
  {
    value: "yoga-wellbeing",
    title: "Yoga & Wellbeing",
    items: [
      "200 hours Vinyasa Yoga",
      "200 hours Yin Yang Yoga",
      "60 hours Trauma Informed Yoga",
      "300 hours Yoga (specialist modules in neuroscience and anatomy - in progress)",
    ],
  },
] as const;

const meetShrutiParagraphs = [
  "My background spans rehabilitation research, personal training and yoga, but my approach has also been shaped by living with a body that can fluctuate and by working in very different environments, from academia and corporate roles to shift work and self-employment.",
  "I know there isn’t one version of a “normal” body, schedule or lifestyle.",
  "My job is to help you understand yours, build strength and confidence, and find an approach to movement that works with you rather than asking you to fit yourself into it.",
  "In the video, I share a little more about how I got here and why I do this work.",
] as const;

const storyParagraphs = [
  "I was diagnosed with psoriatic arthritis while completing my PhD in rehabilitation. A body I'd largely been able to rely on suddenly became much less predictable.",
  "But health has only ever been part of the challenge.",
  "Over the years I've worked in academia, shift work, corporate roles and now self-employment. I've spent a long time trying to find exercise routines that survived changes in work, energy, pain, stress and everyday life.",
  "I've tried pushing through. I've tried being overly cautious. Neither gave me what I wanted.",
  "What I've learned is that there doesn't have to be one perfect routine. We can adapt when we need to, while still building strength, fitness and confidence over time.",
  "I don't sit on the outside giving textbook advice. I bring the research and professional training, but I've also had to work through many of these challenges myself.",
  "That doesn't mean your experience will be the same as mine. It means I know the value of asking better questions, understanding the context and finding an approach that actually fits.",
] as const;

export function AboutPage() {
  const [isIntroVideoPlaying, setIsIntroVideoPlaying] = useState(false);
  useEffect(() => {
    return () => setIsIntroVideoPlaying(false);
  }, []);

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
        description="I bring together research & experience in rehabilitation, fitness and wellbeing to help people move and train in ways that fit their bodies and their real lives. The work is evidence-informed, practical and personal."
        stats={[
          { value: "PhD", label: "Rehabilitation" },
          { value: "Personal Trainer", label: "Strength & Conditioning Coach" },
          { value: "Trauma Informed", label: "Yoga Teacher" },
        ]}
        aside={
          <div className="relative mx-auto max-w-xl">
            <div className="border-brand-white/10 bg-brand-white/8 overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <div className="aspect-[4/5] overflow-hidden rounded-[1.45rem]">
                <ImageWithFallback
                  src="/images/shruti.jpeg"
                  alt="Shruti Turner smiling while hiking in Patagonia"
                  className="h-full w-full object-cover object-[center_62%]"
                />
              </div>
            </div>
          </div>
        }
      />

      <MarketingSection className="section-wash">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-12">
          <div className="max-w-3xl">
            <p className="text-brand-accent mb-4 text-xs font-medium tracking-[0.28em] uppercase">
              Meet Shruti
            </p>
            <h2 className="text-3xl leading-tight md:text-4xl lg:text-[2.75rem]">
              I’m interested in what happens when good movement advice meets real life.
            </h2>
            <div className="text-muted-foreground mt-6 space-y-4 text-base leading-relaxed md:text-lg">
              {meetShrutiParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <div className="border-brand-dark/10 bg-brand-dark aspect-video overflow-hidden rounded-[1.75rem] border shadow-[0_24px_60px_rgba(46,31,51,0.12)]">
            {isIntroVideoPlaying ? (
              <iframe
                src="https://www.youtube-nocookie.com/embed/XYOTSf6EIek?autoplay=1"
                title="About Shruti Turner"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                className="group relative h-full w-full cursor-pointer"
                aria-label="Play About Shruti Turner video"
                data-youtube-id="XYOTSf6EIek"
                onClick={() => setIsIntroVideoPlaying(true)}
              >
                <ImageWithFallback
                  src="https://i.ytimg.com/vi/XYOTSf6EIek/maxresdefault.jpg"
                  alt=""
                  className="h-full w-full object-cover"
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
        </div>
      </MarketingSection>

      <MarketingSection className="section-divider">
        <SectionHeading
          eyebrow="Research × Coaching × Lived Experience"
          title="Three perspectives, brought into one practice."
          description="Each matters on its own. The special part is how they work together."
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
            />
            <div className="text-muted-foreground mt-7 space-y-5 leading-relaxed">
              {storyParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <PullQuote
            quote="Evidence does not replace lived experience. It changes the questions you know to ask."
            attribution="Shruti Turner"
          />
        </div>
      </MarketingSection>

      <MarketingSection className="section-divider">
        <SectionHeading
          eyebrow="Qualifications"
          title="The detail, when you want it."
          description="Click the category to explore my qualifications."
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
                <ul className="text-muted-foreground list-disc space-y-3 pb-1 pl-5 leading-relaxed">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </MarketingSection>

      <PreFooterCtaSection
        compact
        className="-mb-24"
        eyebrow="Work Together"
        title="Ready to find support that fits?"
        description="Explore the coaching options or enquire."
        actions={[
          {
            href: "/coaching",
            label: "Explore coaching",
            icon: ArrowRight,
          },
          {
            href: "/coaching/enquire",
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
                name: "PhD Rehabilitation, Imperial College London",
              },
              {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: "degree",
                name: "MSc Biomedical Engineering, University of Southampton",
              },
              {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: "certificate",
                name: "Level 4 Strength & Conditioning",
              },
              {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: "certificate",
                name: "Level 3 Personal Trainer",
              },
              {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: "certificate",
                name: "Specialist courses: Level 3s Exercise Referral, Pre/Post Natal; Level 4s Nutrition for Athletic Performance, Low Back Pain, Obesity, Diabetes",
              },
              {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: "certificate",
                name: "200 hours Vinyasa Yoga",
              },
              {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: "certificate",
                name: "200 hours Yin Yang Yoga",
              },
              {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: "certificate",
                name: "60 hours Trauma Informed Yoga",
              },
              {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: "certificate",
                name: "300 hours Yoga (specialist modules in neuroscience and anatomy - in progress)",
              },
            ],
          }),
        }}
      />
    </Layout>
  );
}
