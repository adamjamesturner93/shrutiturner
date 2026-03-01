"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Layout } from "../components/layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Clock,
  Calendar,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Dumbbell,
  Heart,
  Zap,
  Target,
  Info,
} from "lucide-react";
import { classDetails, getClassesByType, getTypeColor } from "../data/schedule-data";
import { BookClassButton } from "../components/booking-modal";
import { useI18n } from "../lib/use-i18n";
import type { ClassDefinitionContent } from "@/lib/content";

interface ClassDetailPageProps {
  classDetail?: ClassDefinitionContent | null;
  allClasses?: ClassDefinitionContent[];
}

export function ClassDetailPage({ classDetail: classDetailProp, allClasses }: ClassDetailPageProps) {
  const { id: slug } = useParams<{ id: string }>();
  const classDetail = classDetailProp ?? classDetails.find((c) => c.slug === slug);
  const { fmtTimeStr } = useI18n();

  if (!classDetail) {
    return (
      <Layout>
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 max-w-3xl text-center space-y-6">
            <h1 className="text-4xl">Class Not Found</h1>
            <p className="text-muted-foreground text-lg">
              Sorry, we couldn't find that class. It may have been renamed or
              removed from the schedule.
            </p>
            <Link href="/schedule">
              <Button size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Schedule
              </Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  const typeIcon =
    classDetail.type === "Yoga" ? (
      <Heart className="w-5 h-5" />
    ) : classDetail.type === "HIIT" ? (
      <Zap className="w-5 h-5" />
    ) : (
      <Dumbbell className="w-5 h-5" />
    );

  // Get related classes (same type, excluding current)
  const relatedPool = allClasses ?? getClassesByType(classDetail.type);
  const relatedClasses = relatedPool.filter((c) => c.slug !== classDetail.slug).slice(0, 3);

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-[#2E1F33] text-[#FAFAF8] py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center gap-2 text-sm text-[#FAFAF8]/60">
              <li>
                <Link href="/" className="hover:text-[#B5C49B] transition-colors">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/schedule"
                  className="hover:text-[#B5C49B] transition-colors"
                >
                  Schedule
                </Link>
              </li>
              <li>/</li>
              <li className="text-[#B5C49B]">{classDetail.name}</li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge
              variant="outline"
              className={`${getTypeColor(classDetail.type)} border`}
            >
              {typeIcon}
              <span className="ml-1">{classDetail.type}</span>
            </Badge>
            <Badge
              variant="outline"
              className="border-[#FAFAF8]/30 text-[#FAFAF8]/80"
            >
              {classDetail.level}
            </Badge>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight">
            {classDetail.name}
          </h1>

          <p className="text-xl md:text-2xl text-[#FAFAF8]/90 leading-relaxed mb-8 max-w-3xl">
            {classDetail.shortDescription}
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-6 mb-10">
            <div className="flex items-center gap-2 text-[#B5C49B]">
              <Calendar className="w-5 h-5" />
              <span>{classDetail.day}s</span>
            </div>
            <div className="flex items-center gap-2 text-[#B5C49B]">
              <Clock className="w-5 h-5" />
              <span>
                {fmtTimeStr(classDetail.time)} · {classDetail.duration}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[#B5C49B]">
              <Users className="w-5 h-5" />
              <span>Max {classDetail.maxSpaces} people</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <BookClassButton
              classSlug={classDetail.slug}
              className={classDetail.name}
              day={classDetail.day}
              time={classDetail.time}
              variant="lg"
            />
            <Link href="/schedule">
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-[#B5C49B] text-[#B5C49B] hover:bg-[#B5C49B]/10"
              >
                View Full Schedule
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Long Description */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl mb-8">About This Class</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            {classDetail.longDescription.split("\n\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      {/* What to Expect + Who It's For */}
      <section className="py-16 md:py-20 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12">
            {/* What to Expect */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl">What to Expect</h2>
              </div>
              <ul className="space-y-4">
                {classDetail.whatToExpect.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#4B5B32] flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Who It's For */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl">Who It's For</h2>
              </div>
              <ul className="space-y-4">
                {classDetail.whoItsFor.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#4B5B32] flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl text-center mb-12">Benefits</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {classDetail.benefits.map((benefit, i) => (
              <div
                key={i}
                className="bg-background border rounded-lg p-6 flex items-start gap-3"
              >
                <CheckCircle className="w-5 h-5 text-[#4B5B32] flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment */}
      <section className="py-16 md:py-20 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl">Equipment Needed</h2>
          </div>
          <div className="bg-background border rounded-lg p-6 md:p-8">
            <ul className="space-y-3">
              {classDetail.equipment.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-primary mt-1">-</span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground mt-6 pt-4 border-t">
              Don't have everything? Don't worry — Shruti provides alternatives
              and substitutions at the start of each class. Household items work
              perfectly well.
            </p>
          </div>
        </div>
      </section>

      {/* Instructor */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl mb-6">Your Instructor</h2>
          <div className="bg-background border rounded-lg p-6 md:p-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-20 h-20 rounded-full bg-[#4B5B32]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl text-[#4B5B32]">ST</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl">{classDetail.instructor}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Strength and yoga coach specialising in rehabilitation-informed
                  training for chronic illness and complex bodies. Living with
                  psoriatic arthritis. PhD Biomechanics, PGDip Rehabilitation,
                  650hr Yoga Teacher Training, Level 4 Personal Trainer.
                </p>
                <Link href="/pt"
                  className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                >
                  Work with Shruti 1:1
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Classes */}
      {relatedClasses.length > 0 && (
        <section className="py-16 md:py-20 bg-secondary/20">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl md:text-4xl text-center mb-12">
              More {classDetail.type} Classes
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedClasses.map((relClass) => (
                <Link
                  key={relClass.slug}
                  href={`/schedule/${relClass.slug}`}
                  className="bg-background border rounded-lg p-6 space-y-3 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={getTypeColor(relClass.type)}
                    >
                      {relClass.type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {relClass.level}
                    </span>
                  </div>
                  <h3 className="text-lg group-hover:text-primary transition-colors">
                    {relClass.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {relClass.shortDescription}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {relClass.day}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {fmtTimeStr(relClass.time)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-[#4B5B32] text-[#FAFAF8] py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-8">
          <h2 className="text-3xl md:text-4xl">
            Ready to Try {classDetail.name}?
          </h2>
          <p className="text-lg opacity-90 leading-relaxed">
            Join live or catch the replay. Drop-in, class packs, and monthly
            memberships available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button
                size="lg"
                className="bg-[#FAFAF8] text-[#4B5B32] hover:bg-[#FAFAF8]/90"
              >
                View Pricing & Book
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/schedule">
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-[#FAFAF8] text-[#FAFAF8] hover:bg-[#FAFAF8]/10"
              >
                Full Schedule
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Event Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            name: classDetail.name,
            description: classDetail.shortDescription,
            eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
            eventStatus: "https://schema.org/EventScheduled",
            location: {
              "@type": "VirtualLocation",
              url: "https://shrutiturner.com/schedule/" + classDetail.slug,
            },
            organizer: {
              "@type": "Person",
              name: "Shruti Turner",
              url: "https://shrutiturner.com",
            },
            offers: {
              "@type": "Offer",
              price: "12",
              priceCurrency: "GBP",
              availability: "https://schema.org/InStock",
              url: "https://shrutiturner.com/pricing",
              description: "Drop-in price. Bundles and memberships available from £9/class.",
            },
          }),
        }}
      />
    </Layout>
  );
}
