"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Gift, ShieldCheck } from "lucide-react";
import { Layout } from "@/components/layout";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import type { PublicGiftRedemptionState } from "@/lib/gifts/service";

export function GiftRedeemPage({
  code,
  initialState,
}: {
  code: string;
  initialState: PublicGiftRedemptionState;
}) {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [resultType, setResultType] = useState<"retreat" | "small_group" | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    attendeeFirstName: user?.firstName || "",
    attendeeLastName: user?.lastName || "",
    attendeeEmail: user?.email || "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    dietaryRequirements: "",
    medicalConditions: "",
    mobilityNeeds: "",
    guestTwoFirstName: "",
    guestTwoLastName: "",
    guestTwoEmail: "",
    guestTwoDietaryRequirements: "",
  });

  if (initialState.state === "invalid") {
    return (
      <Layout>
        <SEO title="Gift Not Found" noIndex />
        <section className="section-wash min-h-[calc(100dvh-4rem)] px-4 py-10 md:py-14">
          <div className="container mx-auto flex min-h-[calc(100dvh-12rem)] max-w-3xl items-center">
            <div className="marketing-panel w-full rounded-[2rem] px-6 py-10 text-center md:px-10">
              <h1 className="text-3xl md:text-4xl">Gift code not found</h1>
              <p className="text-muted-foreground mt-4">
                This gift code is invalid or no longer available.
              </p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (initialState.state === "expired") {
    return (
      <Layout>
        <SEO title="Gift Expired" noIndex />
        <section className="section-wash min-h-[calc(100dvh-4rem)] px-4 py-10 md:py-14">
          <div className="container mx-auto flex min-h-[calc(100dvh-12rem)] max-w-3xl items-center">
            <div className="marketing-panel w-full rounded-[2rem] px-6 py-10 text-center md:px-10">
              <h1 className="text-3xl md:text-4xl">This gift has expired</h1>
              <p className="text-muted-foreground mt-4">
                Please contact Shruti if you need help with this gift purchase.
              </p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (initialState.state === "pending_payment") {
    return (
      <Layout>
        <SEO title="Gift Pending Payment" noIndex />
        <section className="section-wash min-h-[calc(100dvh-4rem)] px-4 py-10 md:py-14">
          <div className="container mx-auto flex min-h-[calc(100dvh-12rem)] max-w-3xl items-center">
            <div className="marketing-panel w-full rounded-[2rem] px-6 py-10 text-center md:px-10">
              <h1 className="text-3xl md:text-4xl">This gift is not ready yet</h1>
              <p className="text-muted-foreground mt-4">
                The purchase has not completed yet, so the gift cannot be redeemed.
              </p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  const gift = initialState.gift;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/gift/redeem/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const payload = (await response.json().catch(() => null)) as {
        type?: "retreat" | "small_group";
        message?: string;
      } | null;
      if (!response.ok || !payload?.type) {
        throw new Error(payload?.message || "Failed to redeem gift.");
      }
      setSubmitted(true);
      setResultType(payload.type);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to redeem gift.");
    } finally {
      setSubmitting(false);
    }
  };

  const loginHref = `/login?redirect=/gift/redeem/${code}`;
  const needsSecondGuest = gift.retreat?.guestsIncluded === 2;

  return (
    <Layout>
      <SEO title={`Redeem ${gift.productTitle}`} noIndex />

      <section className="marketing-grid text-brand-white overflow-hidden px-4 py-10 md:py-14">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:gap-10">
            <div>
              <div className="text-brand-accent-light border-brand-white/10 bg-brand-white/8 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm">
                <Gift className="h-4 w-4" />
                Gift redemption
              </div>
              <h1 className="mt-6 text-4xl leading-tight md:text-5xl">{gift.productTitle}</h1>
              <p className="text-brand-white/80 mt-4 max-w-2xl text-lg leading-relaxed">
                {gift.purchaserName} has sent this to you. Redeem it here so the place or retreat
                details are linked to your account instead of staying with the purchaser.
              </p>
            </div>

            <div className="border-brand-white/10 bg-brand-white/8 overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <div className="bg-brand-white/8 rounded-[1.45rem] p-6">
                <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                  What happens here
                </p>
                <div className="mt-5 space-y-3">
                  {[
                    "Sign in first if the gift is not yet attached to your account.",
                    gift.type === "retreat"
                      ? "Complete your own health and access details securely as the attendee."
                      : "Claim the reserved programme place into your own account.",
                    "No payment is taken during redemption.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="border-brand-white/10 bg-brand-white/8 text-brand-white/84 rounded-[1.2rem] border px-4 py-4 text-sm leading-relaxed"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-wash px-4 py-10 md:py-14">
        <div className="container mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            {gift.recipientMessage ? (
              <div className="marketing-panel rounded-[1.5rem] p-6">
                <p className="text-brand-accent text-sm tracking-[0.16em] uppercase">Message</p>
                <p className="text-muted-foreground mt-3 leading-relaxed">
                  {gift.recipientMessage}
                </p>
              </div>
            ) : null}

            {initialState.state === "redeemed" || submitted ? (
              <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-6">
                <h2 className="text-2xl">Gift redeemed</h2>
                <p className="mt-3 text-sm text-emerald-900">
                  {resultType === "retreat" || gift.type === "retreat"
                    ? "Your retreat details are now linked to your account."
                    : "Your programme place has been linked to your account."}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {resultType === "retreat" || gift.type === "retreat" ? (
                    <Button asChild>
                      <Link href="/dashboard/retreats">
                        Go to retreats
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link href="/contact">
                        Contact Shruti
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ) : !user ? (
              <div className="marketing-panel rounded-[1.5rem] p-6">
                <h2 className="text-2xl">Sign in to redeem</h2>
                <p className="text-muted-foreground mt-3 max-w-xl leading-relaxed">
                  The gift is reserved. Sign in first, then you can finish the redemption details
                  securely. If you&apos;re new, the studio will guide you through account setup
                  after verification.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href={loginHref}>Continue to sign in</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="marketing-panel rounded-[1.5rem] p-6">
                  <h2 className="text-2xl">Your details</h2>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="attendeeFirstName">First name</Label>
                      <Input
                        id="attendeeFirstName"
                        required
                        value={formData.attendeeFirstName}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            attendeeFirstName: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="attendeeLastName">Last name</Label>
                      <Input
                        id="attendeeLastName"
                        required
                        value={formData.attendeeLastName}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            attendeeLastName: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="attendeeEmail">Email</Label>
                    <Input
                      id="attendeeEmail"
                      required
                      type="email"
                      value={formData.attendeeEmail}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          attendeeEmail: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {gift.type === "retreat" ? (
                  <>
                    <div className="marketing-panel rounded-[1.5rem] p-6">
                      <h2 className="text-2xl">Retreat details</h2>
                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            required
                            value={formData.phone}
                            onChange={(event) =>
                              setFormData((current) => ({ ...current, phone: event.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emergencyContactPhone">Emergency contact phone</Label>
                          <Input
                            id="emergencyContactPhone"
                            required
                            value={formData.emergencyContactPhone}
                            onChange={(event) =>
                              setFormData((current) => ({
                                ...current,
                                emergencyContactPhone: event.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Label htmlFor="emergencyContactName">Emergency contact name</Label>
                        <Input
                          id="emergencyContactName"
                          required
                          value={formData.emergencyContactName}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              emergencyContactName: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="dietaryRequirements">Dietary requirements</Label>
                          <Textarea
                            id="dietaryRequirements"
                            value={formData.dietaryRequirements}
                            onChange={(event) =>
                              setFormData((current) => ({
                                ...current,
                                dietaryRequirements: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mobilityNeeds">Accessibility / mobility needs</Label>
                          <Textarea
                            id="mobilityNeeds"
                            value={formData.mobilityNeeds}
                            onChange={(event) =>
                              setFormData((current) => ({
                                ...current,
                                mobilityNeeds: event.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Label htmlFor="medicalConditions">Health notes</Label>
                        <Textarea
                          id="medicalConditions"
                          value={formData.medicalConditions}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              medicalConditions: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    {needsSecondGuest ? (
                      <div className="marketing-panel rounded-[1.5rem] p-6">
                        <h2 className="text-2xl">Second guest details</h2>
                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="guestTwoFirstName">First name</Label>
                            <Input
                              id="guestTwoFirstName"
                              required
                              value={formData.guestTwoFirstName}
                              onChange={(event) =>
                                setFormData((current) => ({
                                  ...current,
                                  guestTwoFirstName: event.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="guestTwoLastName">Last name</Label>
                            <Input
                              id="guestTwoLastName"
                              required
                              value={formData.guestTwoLastName}
                              onChange={(event) =>
                                setFormData((current) => ({
                                  ...current,
                                  guestTwoLastName: event.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <Label htmlFor="guestTwoEmail">Email</Label>
                          <Input
                            id="guestTwoEmail"
                            required
                            type="email"
                            value={formData.guestTwoEmail}
                            onChange={(event) =>
                              setFormData((current) => ({
                                ...current,
                                guestTwoEmail: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="mt-4 space-y-2">
                          <Label htmlFor="guestTwoDietaryRequirements">Dietary requirements</Label>
                          <Textarea
                            id="guestTwoDietaryRequirements"
                            value={formData.guestTwoDietaryRequirements}
                            onChange={(event) =>
                              setFormData((current) => ({
                                ...current,
                                guestTwoDietaryRequirements: event.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : null}

                <Button type="submit" size="lg" disabled={submitting}>
                  {submitting ? "Redeeming..." : "Redeem my gift"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            )}
          </div>

          <aside>
            <div className="marketing-panel sticky top-24 rounded-[1.75rem] p-6 shadow-sm">
              <p className="text-brand-accent text-sm tracking-[0.16em] uppercase">Gift code</p>
              <p className="mt-2 font-mono text-lg">{gift.code}</p>
              <h2 className="mt-5 text-2xl">{gift.productTitle}</h2>

              {gift.retreat ? (
                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Room</span>
                    <span>{gift.retreat.roomLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Dates</span>
                    <span>
                      {new Intl.DateTimeFormat("en-GB", {
                        day: "numeric",
                        month: "short",
                      }).format(new Date(gift.retreat.startDate))}
                      {" - "}
                      {new Intl.DateTimeFormat("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(gift.retreat.endDate))}
                    </span>
                  </div>
                </div>
              ) : null}

              {gift.programme ? (
                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Starts</span>
                    <span>
                      {gift.programme.startDate
                        ? new Intl.DateTimeFormat("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }).format(new Date(gift.programme.startDate))
                        : "TBC"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Schedule</span>
                    <span>{gift.programme.scheduleLabel || "TBC"}</span>
                  </div>
                </div>
              ) : null}

              <div className="bg-secondary/20 text-muted-foreground mt-6 rounded-xl border p-4 text-sm">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p>
                    {gift.type === "retreat"
                      ? "Your private health and access details are completed here as the attendee, not by the purchaser."
                      : "Your programme place is reserved already. Redeeming links it to your account."}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
