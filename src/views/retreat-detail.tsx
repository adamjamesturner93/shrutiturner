"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Layout } from "../components/layout";
import { Button } from "../components/ui/button";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useState } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Check,
  X,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { getRetreatBySlug } from "../data/retreat-data";
import { useI18n } from "../lib/use-i18n";
import type { RetreatCombinedContent } from "@/lib/content";

interface RetreatDetailPageProps {
  retreat?: RetreatCombinedContent | null;
}

export function RetreatDetailPage({ retreat: retreatProp }: RetreatDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const retreat = retreatProp ?? getRetreatBySlug(id || "");
  const [selectedDateId, setSelectedDateId] = useState<string>("");

  const { fmtDate, fmtDateRange } = useI18n();

  if (!retreat) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl mb-4">Retreat Not Found</h1>
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
      <div className="aspect-[21/9] bg-secondary relative">
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

      {/* Header */}
      <section className="py-12 md:py-16 bg-[#2E1F33] text-[#FAFAF8]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center gap-2 text-[#B5C49B] mb-4">
            <MapPin className="w-5 h-5" />
            <span className="text-lg">{retreat.location}</span>
          </div>
          <h1 className="text-4xl md:text-5xl mb-4">{retreat.title}</h1>
          <p className="text-xl text-[#B5C49B]">{retreat.subtitle}</p>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-6xl py-12 md:py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Description */}
            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-line text-muted-foreground leading-relaxed">
                {retreat.fullDescription}
              </div>
            </div>

            {/* Suitable For */}
            <div>
              <h2 className="text-2xl mb-6">This Retreat Is For:</h2>
              <ul className="space-y-3">
                {retreat.suitableFor.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Schedule */}
            <div>
              <h2 className="text-2xl mb-6">Daily Schedule</h2>
              <div className="space-y-6">
                {retreat.schedule.map((day, index) => (
                  <div key={index} className="border-l-2 border-primary pl-6">
                    <h3 className="text-lg mb-3">{day.day}</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      {day.activities.map((activity, actIndex) => (
                        <li key={actIndex} className="flex items-start gap-2">
                          <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Included / Not Included */}
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl mb-4">What's Included</h3>
                <ul className="space-y-3">
                  {retreat.included.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xl mb-4">Not Included</h3>
                <ul className="space-y-3">
                  {retreat.notIncluded.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <X className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Accommodation */}
            <div>
              <h2 className="text-2xl mb-4">Accommodation</h2>
              <p className="text-muted-foreground leading-relaxed">
                {retreat.accommodation}
              </p>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Pricing Card */}
              <div className="border rounded-lg p-6 bg-background shadow-sm">
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl">£{price}</span>
                    <span className="text-muted-foreground">per person</span>
                  </div>
                  {isEarlyBird && (
                    <div className="text-sm text-[#4B5B32] bg-[#B5C49B]/20 px-3 py-1 rounded inline-block">
                      Early bird pricing until{" "}
                      {fmtDate(retreat.earlyBirdDeadline)}
                    </div>
                  )}
                  {!isEarlyBird && (
                    <div className="text-sm text-muted-foreground">
                      Early bird pricing (£{retreat.earlyBirdPrice}) has ended
                    </div>
                  )}
                </div>

                {/* Date Selection */}
                <div className="space-y-3 mb-6">
                  <Label>Select Your Date</Label>
                  <RadioGroup
                    value={selectedDateId}
                    onValueChange={setSelectedDateId}
                  >
                    {retreat.dates.map((date) => (
                      <div
                        key={date.id}
                        className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-secondary/50 cursor-pointer transition-colors"
                      >
                        <RadioGroupItem value={date.id} id={date.id} />
                        <label
                          htmlFor={date.id}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="font-medium">
                              {fmtDateRange(date.startDate, date.endDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>
                              {date.availableSpaces} of {date.totalSpaces}{" "}
                              spaces available
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
              <div className="border rounded-lg p-6 bg-secondary/20">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-2">Important Information</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Travel insurance required</li>
                      <li>• Full payment due at booking</li>
                      <li>• See cancellation policy in FAQ</li>
                      <li>• Health declaration required</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Contact CTA */}
              <div className="text-center p-4 bg-[#4B5B32]/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-3">
                  Questions about this retreat?
                </p>
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
