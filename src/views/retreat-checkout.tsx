"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { useState, useEffect } from "react";
import { ArrowLeft, AlertCircle, CreditCard } from "lucide-react";
import { getRetreatBySlug } from "../data/retreat-data";
import { useI18n } from "../lib/use-i18n";

export function RetreatCheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const retreat = getRetreatBySlug(id || "");
  
  // Get selected date from URL params or state
  const [selectedDateId, setSelectedDateId] = useState<string>("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    emergencyContact: "",
    emergencyPhone: "",
    dietaryRequirements: "",
    medicalConditions: "",
    mobilityNeeds: "",
    singleRoom: false,
    agreedToTerms: false,
    agreedToHealth: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get selected date from URL params
    const params = new URLSearchParams(window.location.search);
    const dateId = params.get("date");
    if (dateId) {
      setSelectedDateId(dateId);
    } else if (retreat?.dates.length) {
      // Default to first date if none selected
      setSelectedDateId(retreat.dates[0].id);
    }
  }, [retreat]);

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

  const selectedDate = retreat.dates.find((d) => d.id === selectedDateId);
  const isEarlyBird = new Date() < new Date(retreat.earlyBirdDeadline);
  const price = isEarlyBird ? retreat.earlyBirdPrice : retreat.normalPrice;
  const totalPrice = formData.singleRoom ? price + 200 : price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // In production, this would:
    // 1. Validate all form data
    // 2. Create booking in database
    // 3. Initialize Stripe checkout session
    // 4. Redirect to Stripe payment page
    
    console.log("Booking submitted:", {
      retreat,
      selectedDate,
      formData,
      totalPrice,
    });
    
    setTimeout(() => {
      alert(
        "Booking submitted successfully! In production, you would now be redirected to Stripe for secure payment processing."
      );
      setIsSubmitting(false);
      // navigate('/dashboard'); // Would redirect after successful payment
    }, 1000);
  };

  if (!selectedDate) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl mb-4">Please Select a Date</h1>
          <p className="text-muted-foreground mb-6">
            You need to select a retreat date before proceeding to checkout.
          </p>
          <Link href={`/retreats/${retreat.slug}`}>
            <Button>Back to Retreat Details</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const { fmtDateRange } = useI18n();

  return (
    <Layout>
      <SEO
        title={`Book ${retreat.title} - Checkout`}
        description="Complete your retreat booking"
        canonicalUrl={`https://shrutiturner.com/retreats/${retreat.slug}/checkout`}
      />

      {/* Checkout Header */}
      <section className="bg-[#2E1F33] text-[#FAFAF8] py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link href={`/retreats/${retreat.slug}`}
            className="inline-flex items-center gap-2 text-[#B5C49B] hover:underline mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to retreat details
          </Link>
          <h1 className="text-3xl md:text-4xl">Complete Your Booking</h1>
          <p className="text-[#B5C49B] mt-2">{retreat.title}</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form - 2 columns */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="bg-background border rounded-lg p-6 space-y-6">
                <h2 className="text-2xl">Personal Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-background border rounded-lg p-6 space-y-6">
                <h2 className="text-2xl">Emergency Contact</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Contact Name *</Label>
                    <Input
                      id="emergencyContact"
                      required
                      value={formData.emergencyContact}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContact: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Contact Phone *</Label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      required
                      value={formData.emergencyPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyPhone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Health & Requirements */}
              <div className="bg-background border rounded-lg p-6 space-y-6">
                <h2 className="text-2xl">Health & Requirements</h2>

                <div className="space-y-2">
                  <Label htmlFor="dietaryRequirements">
                    Dietary Requirements
                  </Label>
                  <Textarea
                    id="dietaryRequirements"
                    rows={3}
                    placeholder="Please list any allergies, dietary restrictions, or preferences"
                    value={formData.dietaryRequirements}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dietaryRequirements: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicalConditions">
                    Medical Conditions *
                  </Label>
                  <Textarea
                    id="medicalConditions"
                    rows={4}
                    required
                    placeholder="Please describe your chronic conditions, symptoms, and any relevant medical information that will help us support you during the retreat"
                    value={formData.medicalConditions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        medicalConditions: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobilityNeeds">
                    Mobility or Accessibility Needs
                  </Label>
                  <Textarea
                    id="mobilityNeeds"
                    rows={3}
                    placeholder="Please describe any mobility aids, accessibility requirements, or physical accommodations you need"
                    value={formData.mobilityNeeds}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mobilityNeeds: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Room Preference */}
              <div className="bg-background border rounded-lg p-6 space-y-4">
                <h2 className="text-2xl">Accommodation</h2>
                <div className="flex items-start space-x-3 border rounded-lg p-4">
                  <Checkbox
                    id="singleRoom"
                    checked={formData.singleRoom}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        singleRoom: checked as boolean,
                      })
                    }
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="singleRoom"
                      className="font-medium cursor-pointer block"
                    >
                      Single room supplement (+£200)
                    </label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Standard accommodation is twin share. Select this option
                      for a private room.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="bg-background border rounded-lg p-6 space-y-4">
                <h2 className="text-2xl">Terms & Conditions</h2>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="agreedToTerms"
                      checked={formData.agreedToTerms}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          agreedToTerms: checked as boolean,
                        })
                      }
                    />
                    <label
                      htmlFor="agreedToTerms"
                      className="text-sm cursor-pointer"
                    >
                      I agree to the{" "}
                      <Link href="/terms"
                        className="text-primary underline"
                        target="_blank"
                      >
                        Terms & Conditions
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy"
                        className="text-primary underline"
                        target="_blank"
                      >
                        Privacy Policy
                      </Link>{" "}
                      *
                    </label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="agreedToHealth"
                      checked={formData.agreedToHealth}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          agreedToHealth: checked as boolean,
                        })
                      }
                    />
                    <label
                      htmlFor="agreedToHealth"
                      className="text-sm cursor-pointer"
                    >
                      I have read and agree to the{" "}
                      <Link href="/health-declaration"
                        className="text-primary underline"
                        target="_blank"
                      >
                        Health Declaration
                      </Link>{" "}
                      *
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button - Mobile */}
              <div className="lg:hidden">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={
                    !formData.agreedToTerms ||
                    !formData.agreedToHealth ||
                    isSubmitting
                  }
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  {isSubmitting ? "Processing..." : "Proceed to Payment"}
                </Button>
              </div>
            </form>
          </div>

          {/* Order Summary Sidebar - 1 column */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Order Summary */}
              <div className="bg-background border rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-medium">Order Summary</h2>

                <div className="space-y-3 pb-4 border-b">
                  <div>
                    <p className="font-medium">{retreat.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {retreat.location}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="text-muted-foreground">Dates:</p>
                    <p>
                      {fmtDateRange(selectedDate.startDate, selectedDate.endDate)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Retreat price</span>
                    <span>£{price}</span>
                  </div>
                  {formData.singleRoom && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Single room supplement
                      </span>
                      <span>£200</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-medium">Total Due</span>
                    <span className="text-2xl font-medium">£{totalPrice}</span>
                  </div>
                  {isEarlyBird && (
                    <p className="text-sm text-[#4B5B32] mt-2">
                      🎉 Early bird pricing applied
                    </p>
                  )}
                </div>
              </div>

              {/* Important Info */}
              <div className="bg-[#4B5B32]/10 border border-[#4B5B32]/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#4B5B32] flex-shrink-0 mt-0.5" />
                  <div className="text-sm space-y-2">
                    <p className="font-medium text-foreground">Important</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Payment in full required today</li>
                      <li>• Travel insurance mandatory</li>
                      <li>• See cancellation policy in T&Cs</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Desktop Submit Button */}
              <div className="hidden lg:block">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={
                    !formData.agreedToTerms ||
                    !formData.agreedToHealth ||
                    isSubmitting
                  }
                  onClick={handleSubmit}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  {isSubmitting ? "Processing..." : "Proceed to Payment"}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Secure payment powered by Stripe
                </p>
              </div>

              {/* Trust Signals */}
              <div className="text-center pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  🔒 Your payment information is secure and encrypted
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
