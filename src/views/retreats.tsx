"use client";

import { Layout } from "../components/layout";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin, Users } from "lucide-react";
import { getUpcomingRetreats } from "../data/retreat-data";
import { useI18n } from "../lib/use-i18n";
import type { RetreatCombinedContent } from "@/lib/content";

interface RetreatsPageProps {
  retreats?: RetreatCombinedContent[];
}

export function RetreatsPage({ retreats }: RetreatsPageProps) {
  const retreatData = retreats ?? getUpcomingRetreats();
  const { fmtDateRange, fmtDateShort } = useI18n();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-[#2E1F33] text-[#FAFAF8] py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl leading-tight">
              Retreats for Complex Bodies
            </h1>
            <p className="text-xl md:text-2xl text-[#B5C49B] leading-relaxed">
              Yoga and strength retreats designed for people with chronic
              illness, autoimmune conditions, and bodies that require nuance.
            </p>
          </div>
        </div>
      </section>

      {/* What Makes These Different */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-6">
              These Are Not Mainstream Retreats
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              These retreats are designed specifically for people managing
              chronic conditions who want evidence-based movement, genuine
              community, and space to rest.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="space-y-4">
              <h3 className="text-xl">What You'll Experience:</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>• Rehabilitation-informed yoga practices</li>
                <li>• Evidence-based strength training principles</li>
                <li>• Small groups (max 12 people)</li>
                <li>• Community who understands chronic illness</li>
                <li>• Space to rest without guilt</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl">Who Should Come:</h3>
              <ul className="space-y-3 text-muted-foreground">
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
      <section className="py-20 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl text-center mb-12">
            Upcoming Retreats
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {retreatData.map((retreat) => (
              <div
                key={retreat.id}
                className="bg-background border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-[4/3] bg-secondary relative">
                  <ImageWithFallback
                    src={
                      retreat.slug === "sankalpa"
                        ? "https://images.unsplash.com/photo-1732456593210-e2d1570be82b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwcmV0cmVhdCUyMHBvcnR1Z2FsJTIwY291bnRyeXNpZGV8ZW58MXx8fHwxNzcxNTkxNjQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                        : "https://images.unsplash.com/photo-1762729882448-ac748afc54ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY290dGlzaCUyMGhpZ2hsYW5kcyUyMHdpbnRlciUyMHJldHJlYXR8ZW58MXx8fHwxNzcxNTkxNjQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    }
                    alt={retreat.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-2xl mb-2">{retreat.title}</h3>
                    <p className="text-muted-foreground">{retreat.subtitle}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{retreat.location}</span>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">
                    {retreat.shortDescription}
                  </p>

                  {/* Available Dates */}
                  <div className="space-y-2">
                    {retreat.dates.map((date) => (
                      <div
                        key={date.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>
                            {fmtDateRange(date.startDate, date.endDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>
                            {date.availableSpaces} / {date.totalSpaces} spaces
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing */}
                  <div className="pt-4 border-t">
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-medium">
                        £{retreat.earlyBirdPrice}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        early bird
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-sm text-muted-foreground">
                        £{retreat.normalPrice} after{" "}
                        {fmtDateShort(retreat.earlyBirdDeadline)}
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
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl text-center mb-12">
            Common Questions
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl mb-3">
                Do I need yoga or strength training experience?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                No. These retreats are designed for all levels. Everything is
                adapted to your current capacity and condition. You'll receive
                individualized guidance throughout.
              </p>
            </div>

            <div>
              <h3 className="text-xl mb-3">
                What if I'm having a flare during the retreat?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                All sessions are optional and adaptable. If you need to rest,
                that's completely fine. The retreat environment is designed to
                be flexible and supportive of fluctuating symptoms.
              </p>
            </div>

            <div>
              <h3 className="text-xl mb-3">
                Can you accommodate dietary requirements?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Yes. We cater to all dietary requirements and allergies. You'll
                indicate your needs during the booking process.
              </p>
            </div>

            <div>
              <h3 className="text-xl mb-3">What's the cancellation policy?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Full refund if cancelled more than 60 days before retreat. 50%
                refund 30-60 days before. No refund within 30 days, unless we
                can fill your space. We understand chronic illness is
                unpredictable—please speak with us if you have concerns.
              </p>
            </div>

            <div>
              <h3 className="text-xl mb-3">
                What if I have specific mobility needs?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Please contact us before booking to discuss your specific needs.
                We'll work to ensure the venue and activities are accessible for
                you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-[#4B5B32] text-[#FAFAF8] py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-2xl text-center space-y-6">
          <h2 className="text-3xl md:text-4xl">Questions About Retreats?</h2>
          <p className="text-lg opacity-90 leading-relaxed">
            If you have questions about whether a retreat is suitable for your
            condition or circumstances, please get in touch. I'm happy to
            discuss your specific situation.
          </p>
          <Link href="/pt">
            <Button
              size="lg"
              className="bg-[#FAFAF8] text-[#4B5B32] hover:bg-[#FAFAF8]/90"
            >
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
            mainEntity: [
              {
                "@type": "Question",
                name: "Do I need yoga or strength training experience?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. These retreats are designed for all levels. Everything is adapted to your current capacity and condition. You'll receive individualized guidance throughout.",
                },
              },
              {
                "@type": "Question",
                name: "What if I'm having a flare during the retreat?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "All sessions are optional and adaptable. If you need to rest, that's completely fine. The retreat environment is designed to be flexible and supportive of fluctuating symptoms.",
                },
              },
              {
                "@type": "Question",
                name: "Can you accommodate dietary requirements?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. We cater to all dietary requirements and allergies. You'll indicate your needs during the booking process.",
                },
              },
              {
                "@type": "Question",
                name: "What's the cancellation policy?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Full refund if cancelled more than 60 days before retreat. 50% refund 30-60 days before. No refund within 30 days, unless we can fill your space.",
                },
              },
              {
                "@type": "Question",
                name: "What if I have specific mobility needs?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Please contact us before booking to discuss your specific needs. We'll work to ensure the venue and activities are accessible for you.",
                },
              },
            ],
          }),
        }}
      />
    </Layout>
  );
}
