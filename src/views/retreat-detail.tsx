"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layout } from "../components/layout";
import { Button } from "../components/ui/button";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useState } from "react";
import { Calendar, MapPin, Users, Check, X, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { useI18n } from "../lib/use-i18n";
import type { RetreatCombinedContent } from "@/lib/content";

interface RetreatDetailPageProps {
  retreat?: RetreatCombinedContent | null;
  otherRetreatsAtVenue?: RetreatCombinedContent[];
}

export function RetreatDetailPage({
  retreat: retreatProp,
  otherRetreatsAtVenue = [],
}: RetreatDetailPageProps) {
  const router = useRouter();
  const retreat = retreatProp ?? null;
  const [selectedDateId, setSelectedDateId] = useState<string>("");

  const { fmtDate, fmtDateRange } = useI18n();

  if (!retreat) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="mb-4 text-3xl">Retreat Not Found</h1>
          <Link href="/retreats">
            <Button>View All Retreats</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const isEarlyBird = new Date() < new Date(retreat.earlyBirdDeadline);
  const price = isEarlyBird ? retreat.earlyBirdPrice : retreat.normalPrice;

  const handleBookNow = () => {
    if (selectedDateId) {
      router.push(`/retreats/${retreat.slug}/checkout?date=${selectedDateId}`);
    }
  };

  return (
    <Layout>
      {/* Hero Image */}
      <div className="bg-secondary relative aspect-[21/9]">
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

      {/* Header */}
      <section className="bg-[#2E1F33] py-12 text-[#FAFAF8] md:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-4 flex items-center gap-2 text-[#B5C49B]">
            <MapPin className="h-5 w-5" />
            <span className="text-lg">{retreat.location}</span>
          </div>
          <h1 className="mb-4 text-4xl md:text-5xl">{retreat.title}</h1>
          <p className="text-xl text-[#B5C49B]">{retreat.subtitle}</p>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-12 lg:col-span-2">
            {/* Description */}
            <div className="prose prose-lg max-w-none">
              <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {retreat.fullDescription}
              </div>
            </div>

            {/* Suitable For */}
            <div>
              <h2 className="mb-6 text-2xl">This Retreat Is For:</h2>
              <ul className="space-y-3">
                {retreat.suitableFor.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Schedule */}
            <div>
              <h2 className="mb-6 text-2xl">Daily Schedule</h2>
              <div className="space-y-6">
                {retreat.schedule.map((day, index) => (
                  <div key={index} className="border-primary border-l-2 pl-6">
                    <h3 className="mb-3 text-lg">{day.day}</h3>
                    <ul className="text-muted-foreground space-y-2">
                      {day.activities.map((activity, actIndex) => (
                        <li key={actIndex} className="flex items-start gap-2">
                          <Clock className="mt-0.5 h-4 w-4 flex-shrink-0" />
                          <span>{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Included / Not Included */}
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="mb-4 text-xl">What&apos;s Included</h3>
                <ul className="space-y-3">
                  {retreat.included.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-4 text-xl">Not Included</h3>
                <ul className="space-y-3">
                  {retreat.notIncluded.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <X className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Accommodation */}
            <div>
              <h2 className="mb-4 text-2xl">Accommodation</h2>
              <p className="text-muted-foreground leading-relaxed">{retreat.accommodation}</p>
            </div>

            {otherRetreatsAtVenue.length > 0 && (
              <div>
                <h2 className="mb-6 text-2xl">Other retreats at this venue</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {otherRetreatsAtVenue.map((other) => (
                    <Link
                      key={other.slug}
                      href={`/retreats/${other.slug}`}
                      className="bg-background hover:bg-secondary/40 block rounded-lg border p-4 transition-colors"
                    >
                      <h3 className="mb-1 text-lg">{other.title}</h3>
                      <p className="text-muted-foreground text-sm">{other.subtitle}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Pricing Card */}
              <div className="bg-background rounded-lg border p-6 shadow-sm">
                <div className="mb-6">
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="text-3xl">£{price}</span>
                    <span className="text-muted-foreground">per person</span>
                  </div>
                  {isEarlyBird && (
                    <div className="inline-block rounded bg-[#B5C49B]/20 px-3 py-1 text-sm text-[#4B5B32]">
                      Early bird pricing until {fmtDate(retreat.earlyBirdDeadline)}
                    </div>
                  )}
                  {!isEarlyBird && (
                    <div className="text-muted-foreground text-sm">
                      Early bird pricing (£{retreat.earlyBirdPrice}) has ended
                    </div>
                  )}
                </div>

                {/* Date Selection */}
                <div className="mb-6 space-y-3">
                  <Label>Select Your Date</Label>
                  <RadioGroup value={selectedDateId} onValueChange={setSelectedDateId}>
                    {retreat.dates.map((date) => (
                      <div
                        key={date.id}
                        className="hover:bg-secondary/50 flex cursor-pointer items-center space-x-2 rounded-lg border p-4 transition-colors"
                      >
                        <RadioGroupItem value={date.id} id={date.id} />
                        <label htmlFor={date.id} className="flex-1 cursor-pointer">
                          <div className="mb-1 flex items-center gap-2">
                            <Calendar className="text-primary h-4 w-4" />
                            <span className="font-medium">
                              {fmtDateRange(date.startDate, date.endDate)}
                            </span>
                          </div>
                          <div className="text-muted-foreground flex items-center gap-1 text-sm">
                            <Users className="h-3 w-3" />
                            <span>
                              {date.availableSpaces} of {date.totalSpaces} spaces available
                            </span>
                          </div>
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={!selectedDateId}
                  onClick={handleBookNow}
                >
                  Book This Retreat
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Important Info */}
              <div className="bg-secondary/20 rounded-lg border p-6">
                <div className="mb-4 flex items-start gap-3">
                  <AlertCircle className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    <h3 className="mb-2 font-medium">Important Information</h3>
                    <ul className="text-muted-foreground space-y-2 text-sm">
                      <li>• Travel insurance required</li>
                      <li>• Full payment due at booking</li>
                      <li>• See cancellation policy in FAQ</li>
                      <li>• Health declaration required</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Contact CTA */}
              <div className="rounded-lg bg-[#4B5B32]/10 p-4 text-center">
                <p className="text-muted-foreground mb-3 text-sm">Questions about this retreat?</p>
                <Button variant="outline" size="sm" className="w-full">
                  Contact Shruti
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
