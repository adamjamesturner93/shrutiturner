"use client";

import { Layout } from "../components/layout";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin, Users } from "lucide-react";
import { useI18n } from "../lib/use-i18n";
import type { FaqItemContent, RetreatCombinedContent } from "@/lib/content";

interface RetreatsPageProps {
  retreats?: RetreatCombinedContent[];
  faqs?: FaqItemContent[];
}

const DEFAULT_RETREAT_FAQS: FaqItemContent[] = [
  {
    slug: "faq-retreats-experience",
    question: "Do I need yoga or strength training experience?",
    answer:
      "No. These retreats are designed for all levels. Everything is adapted to your current capacity and condition. You'll receive individualized guidance throughout.",
    sortOrder: 10,
  },
  {
    slug: "faq-retreats-flare",
    question: "What if I'm having a flare during the retreat?",
    answer:
      "All sessions are optional and adaptable. If you need to rest, that's completely fine. The retreat environment is designed to be flexible and supportive of fluctuating symptoms.",
    sortOrder: 20,
  },
  {
    slug: "faq-retreats-dietary",
    question: "Can you accommodate dietary requirements?",
    answer:
      "Yes. We cater to all dietary requirements and allergies. You'll indicate your needs during the booking process.",
    sortOrder: 30,
  },
  {
    slug: "faq-retreats-cancellation",
    question: "What's the cancellation policy?",
    answer:
      "Full refund if cancelled more than 60 days before retreat. 50% refund 30-60 days before. No refund within 30 days, unless we can fill your space. We understand chronic illness is unpredictable, so please speak with us if you have concerns.",
    sortOrder: 40,
  },
  {
    slug: "faq-retreats-accessibility",
    question: "What if I have specific mobility needs?",
    answer:
      "Please contact us before booking to discuss your specific needs. We'll work to ensure the venue and activities are accessible for you.",
    sortOrder: 50,
  },
];

export function RetreatsPage({ retreats, faqs }: RetreatsPageProps) {
  const retreatData = retreats ?? [];
  const retreatFaqs = faqs && faqs.length > 0 ? faqs : DEFAULT_RETREAT_FAQS;
  const { fmtDateRange, fmtDateShort } = useI18n();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-[#2E1F33] py-20 text-[#FAFAF8] md:py-28">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h1 className="text-4xl leading-tight md:text-6xl">Retreats for Complex Bodies</h1>
            <p className="text-xl leading-relaxed text-[#B5C49B] md:text-2xl">
              Yoga and strength retreats designed for people with chronic illness, autoimmune
              conditions, and bodies that require nuance.
            </p>
          </div>
        </div>
      </section>

      {/* What Makes These Different */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-6 text-3xl md:text-4xl">These Are Not Mainstream Retreats</h2>
            <p className="text-muted-foreground text-xl leading-relaxed">
              These retreats are designed specifically for people managing chronic conditions who
              want evidence-based movement, genuine community, and space to rest.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-xl">What You'll Experience:</h3>
              <ul className="text-muted-foreground space-y-3">
                <li>• Rehabilitation-informed yoga practices</li>
                <li>• Evidence-based strength training principles</li>
                <li>• Small groups (max 12 people)</li>
                <li>• Community who understands chronic illness</li>
                <li>• Space to rest without guilt</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl">Who Should Come:</h3>
              <ul className="text-muted-foreground space-y-3">
                <li>• People with autoimmune conditions</li>
                <li>• Those managing chronic pain</li>
                <li>• Anyone with hypermobility or arthritis</li>
                <li>• People tired of generic fitness advice</li>
                <li>• Those ready to build capacity intelligently</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Retreats */}
      <section className="bg-secondary/20 py-20 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl md:text-4xl">Upcoming Retreats</h2>

          <div className="grid gap-8 md:grid-cols-2">
            {retreatData.map((retreat) => (
              <div
                key={retreat.id}
                className="bg-background overflow-hidden rounded-lg border transition-shadow hover:shadow-lg"
              >
                <div className="bg-secondary relative aspect-[4/3]">
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

                <div className="space-y-4 p-6">
                  <div>
                    <h3 className="mb-2 text-2xl">{retreat.title}</h3>
                    <p className="text-muted-foreground">{retreat.subtitle}</p>
                  </div>

                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>{retreat.location}</span>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">
                    {retreat.shortDescription}
                  </p>

                  {/* Available Dates */}
                  <div className="space-y-2">
                    {retreat.dates.map((date) => (
                      <div key={date.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="text-primary h-4 w-4" />
                          <span>{fmtDateRange(date.startDate, date.endDate)}</span>
                        </div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>
                            {date.availableSpaces} / {date.totalSpaces} spaces
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing */}
                  <div className="border-t pt-4">
                    <div className="mb-4 flex items-baseline gap-2">
                      <span className="text-2xl font-medium">£{retreat.earlyBirdPrice}</span>
                      <span className="text-muted-foreground text-sm">early bird</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground text-sm">
                        £{retreat.normalPrice} after {fmtDateShort(retreat.earlyBirdDeadline)}
                      </span>
                    </div>

                    <Link href={`/retreats/${retreat.slug}`}>
                      <Button className="w-full">
                        View Details & Book
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-12 text-center text-3xl md:text-4xl">Common Questions</h2>

          <div className="space-y-8">
            {retreatFaqs.map((faq) => (
              <div key={faq.slug}>
                <h3 className="mb-3 text-xl">{faq.question}</h3>
                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-[#4B5B32] py-20 text-[#FAFAF8] md:py-24">
        <div className="container mx-auto max-w-2xl space-y-6 px-4 text-center">
          <h2 className="text-3xl md:text-4xl">Questions About Retreats?</h2>
          <p className="text-lg leading-relaxed opacity-90">
            If you have questions about whether a retreat is suitable for your condition or
            circumstances, please get in touch. I'm happy to discuss your specific situation.
          </p>
          <Link href="/pt">
            <Button size="lg" className="bg-[#FAFAF8] text-[#4B5B32] hover:bg-[#FAFAF8]/90">
              Send an Enquiry
            </Button>
          </Link>
        </div>
      </section>

      {/* Structured Data */}
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
