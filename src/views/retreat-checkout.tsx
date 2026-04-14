"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Calendar,
  Check,
  Gift,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import {
  CURRENT_HEALTH_DATA_CONSENT_VERSION,
  CURRENT_HEALTH_WAIVER_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/data/legal-documents";
import type { RetreatCombinedContent, RetreatRoomOptionContent } from "@/lib/content";
import { useI18n } from "@/lib/use-i18n";

type PendingAcceptance = {
  type: string;
  currentVersion: string;
};

function formatMoney(pence: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

function getDepositAmountPence(roomOption: RetreatRoomOptionContent) {
  if (typeof roomOption.depositPence === "number" && roomOption.depositPence > 0) {
    return roomOption.depositPence;
  }
  if (roomOption.normalPricePence <= 25000) return roomOption.normalPricePence;
  return Math.min(roomOption.normalPricePence, 30000);
}

function getDefaultRoomOptionId(date: RetreatCombinedContent["dates"][number] | null | undefined) {
  if (!date) return "";
  return (
    date.roomOptions.find((option) => !option.isWaitlistOnly && option.availableSpots > 0)?.id ||
    date.roomOptions[0]?.id ||
    ""
  );
}

function getRoomAvailabilityLabel(roomOption: RetreatRoomOptionContent) {
  if (roomOption.isWaitlistOnly) return "Waitlist only";
  if (roomOption.availableSpots <= 0) return "Sold out";
  return `${roomOption.availableSpots} ${roomOption.availableSpots === 1 ? "place" : "places"} left`;
}

function getRoomGuestLabel(roomOption: RetreatRoomOptionContent) {
  return roomOption.guestsIncluded > 1
    ? `Includes ${roomOption.guestsIncluded} guests`
    : "For one guest";
}

export function RetreatCheckoutPage({ retreat }: { retreat?: RetreatCombinedContent | null }) {
  const searchParams = useSearchParams();
  const { fmtDate, fmtDateRange } = useI18n();
  const { user, acceptTermsAndHealth, acceptHealthDataConsent, refreshAccountProfile } = useAuth();

  const queryDateId = searchParams.get("date");
  const queryRoomId = searchParams.get("room");
  const checkoutState = searchParams.get("checkout");
  const isGiftDefault = searchParams.get("gift") === "1";

  const [purchaseMode, setPurchaseMode] = useState<"self" | "gift">(
    isGiftDefault ? "gift" : "self"
  );
  const [selectedDateId, setSelectedDateId] = useState(queryDateId || retreat?.dates[0]?.id || "");
  const [selectedRoomId, setSelectedRoomId] = useState(queryRoomId || "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingLegalAcceptances, setPendingLegalAcceptances] = useState<PendingAcceptance[]>([]);
  const [formData, setFormData] = useState({
    purchaserFirstName: "",
    purchaserLastName: "",
    purchaserEmail: "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    dietaryRequirements: "",
    medicalConditions: "",
    mobilityNeeds: "",
    bookingForAnotherAttendee: false,
    attendeeFirstName: "",
    attendeeLastName: "",
    attendeeEmail: "",
    guestTwoFirstName: "",
    guestTwoLastName: "",
    guestTwoEmail: "",
    guestTwoDietaryRequirements: "",
    agreedToTerms: false,
    agreedToHealth: false,
    agreedToHealthData: false,
    recipientFirstName: "",
    recipientLastName: "",
    recipientEmail: "",
    recipientMessage: "",
    deliveryTarget: "recipient" as "recipient" | "buyer",
  });

  useEffect(() => {
    if (!retreat) return;
    const nextDateId =
      retreat.dates.find((date) => date.id === selectedDateId)?.id || retreat.dates[0]?.id || "";
    if (nextDateId !== selectedDateId) {
      setSelectedDateId(nextDateId);
    }
  }, [retreat, selectedDateId]);

  const selectedDate = useMemo(
    () => retreat?.dates.find((date) => date.id === selectedDateId) || retreat?.dates[0] || null,
    [retreat, selectedDateId]
  );

  useEffect(() => {
    if (!selectedDate) return;
    const validRoom = selectedDate.roomOptions.find((option) => option.id === selectedRoomId);
    if (!validRoom) {
      setSelectedRoomId(getDefaultRoomOptionId(selectedDate));
    }
  }, [selectedDate, selectedRoomId]);

  useEffect(() => {
    if (!user) return;
    setFormData((current) => ({
      ...current,
      purchaserFirstName: current.purchaserFirstName || user.firstName || "",
      purchaserLastName: current.purchaserLastName || user.lastName || "",
      purchaserEmail: current.purchaserEmail || user.email || "",
      attendeeFirstName: current.attendeeFirstName || user.firstName || "",
      attendeeLastName: current.attendeeLastName || user.lastName || "",
      attendeeEmail: current.attendeeEmail || user.email || "",
    }));
  }, [user]);

  const selectedRoom =
    selectedDate?.roomOptions.find((option) => option.id === selectedRoomId) ||
    selectedDate?.roomOptions[0] ||
    null;

  if (!retreat) {
    return (
      <Layout>
        <SEO title="Retreat Checkout" noIndex />
        <section className="section-wash min-h-[calc(100dvh-4rem)] px-4 py-10 md:py-14">
          <div className="container mx-auto flex min-h-[calc(100dvh-12rem)] max-w-3xl items-center">
            <div className="marketing-panel w-full rounded-[2rem] px-6 py-10 text-center md:px-10">
              <h1 className="text-3xl md:text-4xl">Retreat not found</h1>
              <p className="text-muted-foreground mt-4">This retreat is no longer available.</p>
              <Button asChild className="mt-6">
                <Link href="/retreats">View retreats</Link>
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  const totalPricePence = selectedRoom?.normalPricePence ?? 0;
  const depositAmountPence = selectedRoom ? getDepositAmountPence(selectedRoom) : 0;
  const balanceAmountPence = Math.max(totalPricePence - depositAmountPence, 0);
  const termsSatisfied = Boolean(user?.hasAgreedToTerms || formData.agreedToTerms);
  const waiverSatisfied = Boolean(user?.hasAgreedToHealth || formData.agreedToHealth);
  const healthDataSatisfied = Boolean(
    user?.hasConsentedToHealthData || formData.agreedToHealthData
  );

  const purchaserFirstName = formData.purchaserFirstName || user?.firstName || "";
  const purchaserLastName = formData.purchaserLastName || user?.lastName || "";
  const purchaserEmail = formData.purchaserEmail || user?.email || "";
  const attendeeFirstName = formData.bookingForAnotherAttendee
    ? formData.attendeeFirstName
    : purchaserFirstName;
  const attendeeLastName = formData.bookingForAnotherAttendee
    ? formData.attendeeLastName
    : purchaserLastName;
  const attendeeEmail = formData.bookingForAnotherAttendee
    ? formData.attendeeEmail
    : purchaserEmail;

  const resolvePendingLegalAcceptances = async () => {
    const needsTerms = pendingLegalAcceptances.some((item) => item.type === "terms");
    const needsHealthWaiver = pendingLegalAcceptances.some((item) => item.type === "health_waiver");
    const needsHealthData = pendingLegalAcceptances.some((item) => item.type === "health_data");
    const unsupportedAcceptances = pendingLegalAcceptances.filter(
      (item) =>
        item.type !== "terms" && item.type !== "health_waiver" && item.type !== "health_data"
    );

    if (unsupportedAcceptances.length > 0) {
      throw new Error("Some required agreements cannot be refreshed from this page yet.");
    }

    if (needsTerms || needsHealthWaiver) {
      await acceptTermsAndHealth(needsTerms, needsHealthWaiver);
    }

    if (needsHealthData) {
      await acceptHealthDataConsent();
    }

    await refreshAccountProfile();
    setPendingLegalAcceptances([]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!selectedDate || !selectedRoom) {
      setError("Please choose a retreat date and room option before continuing.");
      setIsSubmitting(false);
      return;
    }

    if (selectedRoom.isWaitlistOnly || selectedRoom.availableSpots <= 0) {
      setError("That room option is no longer available.");
      setIsSubmitting(false);
      return;
    }

    if (purchaseMode === "self") {
      if (!termsSatisfied || !waiverSatisfied || !healthDataSatisfied) {
        setError("Please complete the required agreements before continuing.");
        setIsSubmitting(false);
        return;
      }

      if (formData.bookingForAnotherAttendee) {
        if (!attendeeFirstName.trim() || !attendeeLastName.trim() || !attendeeEmail.trim()) {
          setError("Please complete the attendee details before continuing.");
          setIsSubmitting(false);
          return;
        }
      }

      if (
        selectedRoom.guestsIncluded > 1 &&
        (!formData.guestTwoFirstName.trim() ||
          !formData.guestTwoLastName.trim() ||
          !formData.guestTwoEmail.trim())
      ) {
        setError("Please complete the second guest details before continuing.");
        setIsSubmitting(false);
        return;
      }
    } else if (
      !formData.recipientFirstName.trim() ||
      !formData.recipientLastName.trim() ||
      !formData.recipientEmail.trim()
    ) {
      setError("Please complete the gift recipient details before continuing.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (pendingLegalAcceptances.length > 0) {
        await resolvePendingLegalAcceptances();
      }

      if (purchaseMode === "self" && user) {
        if (!user.hasAgreedToTerms || !user.hasAgreedToHealth) {
          await acceptTermsAndHealth(!user.hasAgreedToTerms, !user.hasAgreedToHealth);
        }
        if (!user.hasConsentedToHealthData) {
          await acceptHealthDataConsent();
        }
      }

      const response = await fetch(`/api/retreats/${retreat.slug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          retreatDateId: selectedDate.id,
          roomOptionId: selectedRoom.id,
          purchaseMode,
          purchaserFirstName,
          purchaserLastName,
          purchaserEmail,
          attendeeFirstName,
          attendeeLastName,
          attendeeEmail,
          phone: formData.phone,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
          dietaryRequirements: formData.dietaryRequirements,
          medicalConditions: formData.medicalConditions,
          mobilityNeeds: formData.mobilityNeeds,
          guestTwoFirstName: formData.guestTwoFirstName,
          guestTwoLastName: formData.guestTwoLastName,
          guestTwoEmail: formData.guestTwoEmail,
          guestTwoDietaryRequirements: formData.guestTwoDietaryRequirements,
          acceptedTermsVersion:
            purchaseMode === "self"
              ? (user?.currentTermsVersion ?? CURRENT_TERMS_VERSION)
              : CURRENT_TERMS_VERSION,
          acceptedHealthWaiverVersion:
            purchaseMode === "self"
              ? (user?.currentHealthWaiverVersion ?? CURRENT_HEALTH_WAIVER_VERSION)
              : CURRENT_HEALTH_WAIVER_VERSION,
          acceptedHealthDataVersion:
            purchaseMode === "self"
              ? (user?.currentHealthDataConsentVersion ?? CURRENT_HEALTH_DATA_CONSENT_VERSION)
              : CURRENT_HEALTH_DATA_CONSENT_VERSION,
          recipientFirstName: formData.recipientFirstName,
          recipientLastName: formData.recipientLastName,
          recipientEmail: formData.recipientEmail,
          recipientMessage: formData.recipientMessage,
          deliveryTarget: formData.deliveryTarget,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        checkoutUrl?: string;
        message?: string;
        code?: string;
        requiredAcceptances?: PendingAcceptance[];
      } | null;
      if (!response.ok || !payload?.checkoutUrl) {
        if (
          response.status === 409 &&
          payload?.code === "LEGAL_ACCEPTANCE_REQUIRED" &&
          Array.isArray(payload.requiredAcceptances)
        ) {
          setPendingLegalAcceptances(payload.requiredAcceptances);
          throw new Error(
            "Updated legal agreements are required before checkout. Review them below, then continue again."
          );
        }
        if (
          response.status === 409 &&
          payload?.code === "GUEST_LEGAL_ACCEPTANCE_REFRESH_REQUIRED"
        ) {
          throw new Error(
            payload.message ||
              "The retreat legal agreements have changed. Refresh this page and review the latest versions before continuing."
          );
        }
        throw new Error(payload?.message || "Failed to start checkout.");
      }

      window.location.href = payload.checkoutUrl;
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to start checkout.");
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <SEO
        title={`Book ${retreat.title} - Shruti Turner`}
        description={`Select your retreat date and room for ${retreat.title}.`}
        canonicalUrl={`https://shrutiturner.co.uk/retreats/${retreat.slug}/checkout`}
        noIndex
      />

      <section className="marketing-grid text-brand-white overflow-hidden px-4 py-10 md:py-14">
        <div className="container mx-auto max-w-6xl">
          <Link
            href={`/retreats/${retreat.slug}`}
            className="text-brand-accent-light inline-flex items-center gap-2 text-sm hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to retreat details
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-10">
            <div>
              <h1 className="text-4xl leading-tight md:text-5xl">
                {purchaseMode === "gift" ? "Gift This Retreat" : "Complete Your Retreat Booking"}
              </h1>
              <p className="text-brand-white/80 mt-4 max-w-2xl text-lg leading-relaxed">
                {retreat.title} · {retreat.location}
              </p>
            </div>

            <div className="border-brand-white/10 bg-brand-white/8 overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <div className="bg-brand-white/8 rounded-[1.45rem] p-6">
                <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                  Selected pricing
                </p>
                <div className="text-brand-white/84 mt-4 space-y-2 text-sm">
                  {selectedRoom ? (
                    <>
                      <p>
                        {purchaseMode === "gift"
                          ? `${formatMoney(totalPricePence, retreat.currency)} due today`
                          : `${formatMoney(depositAmountPence, retreat.currency)} deposit today`}
                      </p>
                      <p>{selectedRoom.label}</p>
                    </>
                  ) : (
                    <p>Select a date and room to confirm the amount due.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-wash px-4 py-10 md:py-14">
        <div className="container mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            {checkoutState === "success" ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                {purchaseMode === "gift"
                  ? "Payment received. The gift email is on its way."
                  : "Your deposit has been received. A confirmation and balance payment link have been sent to your email."}
              </div>
            ) : null}
            {checkoutState === "cancelled" ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Checkout was cancelled. Your selections are still here if you want to try again.
              </div>
            ) : null}
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="border-brand-dark/10 bg-background rounded-[1.5rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant={purchaseMode === "self" ? "default" : "outline"}
                  onClick={() => setPurchaseMode("self")}
                >
                  Booking for me
                </Button>
                <Button
                  type="button"
                  variant={purchaseMode === "gift" ? "default" : "outline"}
                  onClick={() => setPurchaseMode("gift")}
                >
                  Buy as a gift
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="marketing-panel rounded-[1.5rem] p-6">
                <h2 className="text-2xl">1. Choose your date</h2>
                <div className="mt-6 grid gap-4">
                  {retreat.dates.map((date) => {
                    const isSelected = date.id === selectedDate?.id;
                    return (
                      <button
                        key={date.id}
                        type="button"
                        className={`rounded-[1.25rem] border p-4 text-left transition-colors ${
                          isSelected
                            ? "border-brand-accent bg-brand-accent/5"
                            : "hover:bg-secondary/20"
                        }`}
                        onClick={() => setSelectedDateId(date.id)}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-lg">{fmtDateRange(date.startDate, date.endDate)}</p>
                            <p className="text-muted-foreground mt-1 text-sm">
                              {date.availableSpaces} of {date.totalSpaces} places currently
                              available
                            </p>
                          </div>
                          <Calendar className="text-brand-accent h-5 w-5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="marketing-panel rounded-[1.5rem] p-6">
                <h2 className="text-2xl">2. Choose your room</h2>
                {selectedDate ? (
                  <div className="mt-6 grid gap-4">
                    {selectedDate.roomOptions.map((roomOption) => {
                      const isSelected = roomOption.id === selectedRoom?.id;
                      const isUnavailable =
                        roomOption.isWaitlistOnly || roomOption.availableSpots <= 0;
                      return (
                        <button
                          key={roomOption.id}
                          type="button"
                          disabled={isUnavailable}
                          className={`rounded-[1.25rem] border p-5 text-left transition-colors ${
                            isSelected
                              ? "border-brand-accent bg-brand-accent/5"
                              : "hover:bg-secondary/20"
                          } ${isUnavailable ? "opacity-60" : ""}`}
                          onClick={() => setSelectedRoomId(roomOption.id)}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-3">
                                <p className="text-xl">{roomOption.label}</p>
                                <span className="bg-secondary/60 rounded-full px-3 py-1 text-xs tracking-[0.16em] uppercase">
                                  {getRoomAvailabilityLabel(roomOption)}
                                </span>
                              </div>
                              <p className="text-muted-foreground text-sm leading-relaxed">
                                {roomOption.description}
                              </p>
                              <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                                <span className="inline-flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  {getRoomGuestLabel(roomOption)}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                  <BedDouble className="h-4 w-4" />
                                  {roomOption.type === "single"
                                    ? "Private room"
                                    : roomOption.type === "shared_private"
                                      ? "Private double room"
                                      : "Shared accommodation"}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-2xl">
                                {formatMoney(roomOption.normalPricePence, retreat.currency)}
                              </p>
                              <p className="text-muted-foreground mt-1 text-sm">
                                Deposit today{" "}
                                {formatMoney(getDepositAmountPence(roomOption), retreat.currency)}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="marketing-panel rounded-[1.5rem] p-6">
                <h2 className="text-2xl">3. Purchaser details</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="purchaserFirstName">First name</Label>
                    <Input
                      id="purchaserFirstName"
                      required
                      value={purchaserFirstName}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          purchaserFirstName: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchaserLastName">Last name</Label>
                    <Input
                      id="purchaserLastName"
                      required
                      value={purchaserLastName}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          purchaserLastName: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="purchaserEmail">Email</Label>
                  <Input
                    id="purchaserEmail"
                    required
                    type="email"
                    value={purchaserEmail}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        purchaserEmail: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {purchaseMode === "self" ? (
                <>
                  <div className="marketing-panel rounded-[1.5rem] p-6">
                    <div className="flex items-start gap-3 rounded-xl border p-4">
                      <Checkbox
                        id="bookingForAnotherAttendee"
                        checked={formData.bookingForAnotherAttendee}
                        onCheckedChange={(checked) =>
                          setFormData((current) => ({
                            ...current,
                            bookingForAnotherAttendee: checked === true,
                          }))
                        }
                      />
                      <div>
                        <label htmlFor="bookingForAnotherAttendee" className="cursor-pointer">
                          The attendee is someone else
                        </label>
                        <p className="text-muted-foreground mt-1 text-sm">
                          Keep the purchaser and attendee separate if you are securing the place for
                          another person.
                        </p>
                      </div>
                    </div>

                    {formData.bookingForAnotherAttendee ? (
                      <div className="mt-6">
                        <h2 className="text-2xl">4. Attendee details</h2>
                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="attendeeFirstName">First name</Label>
                            <Input
                              id="attendeeFirstName"
                              required={formData.bookingForAnotherAttendee}
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
                              required={formData.bookingForAnotherAttendee}
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
                            required={formData.bookingForAnotherAttendee}
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
                    ) : null}
                  </div>

                  <div className="marketing-panel rounded-[1.5rem] p-6">
                    <h2 className="text-2xl">5. Health, access, and emergency details</h2>
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
                        <Label htmlFor="mobilityNeeds">Accessibility or mobility needs</Label>
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
                        required
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

                  {selectedRoom && selectedRoom.guestsIncluded > 1 ? (
                    <div className="rounded-[1.5rem] border p-6">
                      <h2 className="text-2xl">6. Second guest details</h2>
                      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                        This room reserves space for two guests, so please add the second guest now.
                      </p>
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

                  <div className="rounded-[1.5rem] border p-6">
                    <h2 className="text-2xl">7. Agreements</h2>

                    {user?.hasAgreedToTerms ? (
                      <div className="mt-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>Terms & Conditions already accepted on your account.</span>
                      </div>
                    ) : (
                      <label className="mt-6 flex items-start gap-3 text-sm">
                        <Checkbox
                          checked={formData.agreedToTerms}
                          onCheckedChange={(checked) =>
                            setFormData((current) => ({
                              ...current,
                              agreedToTerms: checked === true,
                            }))
                          }
                        />
                        <span>
                          I agree to the{" "}
                          <Link href="/terms" target="_blank" className="text-primary underline">
                            Terms & Conditions
                          </Link>{" "}
                          and have read the{" "}
                          <Link
                            href="/refund-policy"
                            target="_blank"
                            className="text-primary underline"
                          >
                            Refund & Cancellation Policy
                          </Link>
                          .
                        </span>
                      </label>
                    )}

                    {user?.hasAgreedToHealth ? (
                      <div className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>Health & Liability Waiver already accepted on your account.</span>
                      </div>
                    ) : (
                      <label className="mt-4 flex items-start gap-3 text-sm">
                        <Checkbox
                          checked={formData.agreedToHealth}
                          onCheckedChange={(checked) =>
                            setFormData((current) => ({
                              ...current,
                              agreedToHealth: checked === true,
                            }))
                          }
                        />
                        <span>
                          I have read and agree to the{" "}
                          <Link
                            href="/health-declaration"
                            target="_blank"
                            className="text-primary underline"
                          >
                            Health & Liability Waiver
                          </Link>
                          .
                        </span>
                      </label>
                    )}

                    {user?.hasConsentedToHealthData ? (
                      <div className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>Health-data consent already recorded on your account.</span>
                      </div>
                    ) : (
                      <label className="mt-4 flex items-start gap-3 text-sm">
                        <Checkbox
                          checked={formData.agreedToHealthData}
                          onCheckedChange={(checked) =>
                            setFormData((current) => ({
                              ...current,
                              agreedToHealthData: checked === true,
                            }))
                          }
                        />
                        <span>
                          I explicitly consent to Shruti Turner processing the health information I
                          provide so this retreat can be delivered safely and appropriately.
                        </span>
                      </label>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-[1.5rem] border p-6">
                  <h2 className="flex items-center gap-2 text-2xl">
                    <Gift className="text-brand-accent h-5 w-5" />
                    4. Gift details
                  </h2>
                  <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                    Gift purchases reserve this retreat place now. The recipient completes their own
                    attendee, health, and access details later through the redemption link.
                  </p>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="recipientFirstName">Recipient first name</Label>
                      <Input
                        id="recipientFirstName"
                        required
                        value={formData.recipientFirstName}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            recipientFirstName: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipientLastName">Recipient last name</Label>
                      <Input
                        id="recipientLastName"
                        required
                        value={formData.recipientLastName}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            recipientLastName: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="recipientEmail">Recipient email</Label>
                    <Input
                      id="recipientEmail"
                      required
                      type="email"
                      value={formData.recipientEmail}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          recipientEmail: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="recipientMessage">Message</Label>
                    <Textarea
                      id="recipientMessage"
                      value={formData.recipientMessage}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          recipientMessage: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="mt-4 rounded-xl border p-4">
                    <p className="text-sm">Delivery</p>
                    <div className="mt-3 flex flex-col gap-3 text-sm">
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="radio"
                          checked={formData.deliveryTarget === "recipient"}
                          onChange={() =>
                            setFormData((current) => ({
                              ...current,
                              deliveryTarget: "recipient",
                            }))
                          }
                        />
                        <span className="inline-flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Send the gift directly to the recipient
                        </span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="radio"
                          checked={formData.deliveryTarget === "buyer"}
                          onChange={() =>
                            setFormData((current) => ({
                              ...current,
                              deliveryTarget: "buyer",
                            }))
                          }
                        />
                        <span>Send the redemption link to me to forward later</span>
                      </label>
                    </div>
                  </div>
                  <div className="bg-secondary/20 text-muted-foreground mt-4 rounded-xl border p-4 text-sm">
                    Gift purchases follow the{" "}
                    <Link href="/terms" target="_blank" className="text-primary underline">
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link href="/refund-policy" target="_blank" className="text-primary underline">
                      Refund & Cancellation Policy
                    </Link>
                    .
                  </div>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting
                  ? "Redirecting..."
                  : purchaseMode === "gift"
                    ? "Continue to gift checkout"
                    : "Continue to deposit checkout"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>

          <aside>
            <div className="sticky top-24 rounded-[1.75rem] border p-6 shadow-sm">
              <p className="text-brand-accent text-sm tracking-[0.16em] uppercase">
                Booking summary
              </p>
              <h2 className="mt-3 text-2xl">{retreat.title}</h2>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Date</span>
                  <span className="max-w-[14rem] text-right">
                    {selectedDate
                      ? fmtDateRange(selectedDate.startDate, selectedDate.endDate)
                      : "Select a date"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Room</span>
                  <span className="max-w-[14rem] text-right">
                    {selectedRoom?.label || "Select a room"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Guests</span>
                  <span>{selectedRoom ? getRoomGuestLabel(selectedRoom) : "TBC"}</span>
                </div>
              </div>

              {selectedRoom ? (
                <>
                  <div className="bg-secondary/20 mt-6 rounded-[1.25rem] border p-4">
                    {purchaseMode === "gift" ? (
                      <>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Due today</span>
                          <span className="text-xl">
                            {formatMoney(totalPricePence, retreat.currency)}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                          Gift purchases reserve this exact room and date in full.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Deposit today</span>
                          <span className="text-xl">
                            {formatMoney(depositAmountPence, retreat.currency)}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Balance later</span>
                          <span>{formatMoney(balanceAmountPence, retreat.currency)}</span>
                        </div>
                        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                          The balance will be payable later from your dashboard or the secure link
                          sent by email.
                        </p>
                      </>
                    )}
                  </div>

                  <div className="mt-6 space-y-3 text-sm">
                    <div className="flex items-start gap-3 rounded-xl border p-4">
                      <ShieldCheck className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                      <p className="text-muted-foreground leading-relaxed">
                        {purchaseMode === "gift"
                          ? "The recipient completes their own attendee and health details securely when they redeem the gift."
                          : "Health and access details are collected now so the retreat can be delivered safely and appropriately."}
                      </p>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border p-4">
                      <AlertCircle className="text-brand-accent mt-0.5 h-5 w-5 flex-shrink-0" />
                      <p className="text-muted-foreground leading-relaxed">
                        Please contact Shruti before booking if you have accessibility questions
                        about the venue or room set-up.
                      </p>
                    </div>
                  </div>
                </>
              ) : null}

              <div className="text-muted-foreground mt-6 border-t pt-6 text-sm">
                <p>
                  Retreat: {retreat.location}
                  {selectedDate ? ` · ${fmtDate(selectedDate.startDate)}` : ""}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
