import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X, Check, ArrowRight, AlertCircle, Download } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth, type CreditItem } from "../context/auth-context";
import { useI18n } from "../lib/use-i18n";
import type { PublicPricingDto } from "@/lib/api/types";

type CheckoutResult = {
  checkoutUrl: string;
};

/**
 * Compute the next occurrence of a given day + time (HH:MM) from now.
 * Returns a Date for that upcoming slot.
 */
function getNextClassDatetime(day: string, time: string): Date {
  const dayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  const targetDay = dayMap[day] ?? 0;
  const [hours, minutes] = time.split(":").map(Number);

  const now = new Date();
  const result = new Date(now);
  result.setHours(hours, minutes, 0, 0);

  const currentDay = now.getDay();
  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  // If it's the same day but the time has passed, go to next week
  if (daysUntil === 0 && result <= now) daysUntil = 7;
  result.setDate(result.getDate() + daysUntil);

  return result;
}

/**
 * Generate an ICS calendar file content string for a class booking.
 */
function generateICS(title: string, day: string, time: string, durationMin: number): string {
  const nextDate = getNextClassDatetime(day, time);
  const endDate = new Date(nextDate.getTime() + durationMin * 60 * 1000);

  const fmt = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Shruti Turner//Class Booking//EN",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(nextDate)}`,
    `DTEND:${fmt(endDate)}`,
    `SUMMARY:${title} — Shruti Turner`,
    "DESCRIPTION:Join from your Private Studio: https://shrutiturner.com/dashboard",
    "URL:https://shrutiturner.com/dashboard",
    "STATUS:CONFIRMED",
    `UID:${Date.now()}@shrutiturner.com`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadICS(title: string, day: string, time: string, durationStr: string) {
  const durationMin = parseInt(durationStr) || 60;
  const ics = generateICS(title, day, time, durationMin);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ──── Booking confirmation toast/card ──── */

interface BookingConfirmationProps {
  className: string;
  day: string;
  time: string;
  duration?: string;
  creditUsed: CreditItem;
  onClose: () => void;
}

export function BookingConfirmation({
  className,
  day,
  time,
  duration = "60 min",
  creditUsed,
  onClose,
}: BookingConfirmationProps) {
  const { fmtTimeStr } = useI18n();
  const creditLabel =
    creditUsed.type === "membership"
      ? `Membership class (${creditUsed.label})`
      : `Purchased credit — ${creditUsed.sourceLabel}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-background animate-in fade-in zoom-in w-full max-w-sm space-y-6 rounded-lg border p-8 text-center shadow-xl duration-200">
        <div className="bg-brand-accent/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
          <Check className="text-brand-accent h-8 w-8" />
        </div>
        <div>
          <h3 className="mb-2 text-2xl">You're booked.</h3>
          <p className="text-muted-foreground">
            {className} — {day} at {fmtTimeStr(time)}
          </p>
        </div>
        <div className="bg-secondary/30 text-muted-foreground rounded-lg p-3 text-sm">
          {creditLabel}
        </div>
        <p className="text-muted-foreground text-xs">
          A confirmation email with calendar invite has been sent to your inbox.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={() => downloadICS(className, day, time, duration)}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Calendar Event (.ics)
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ──── Purchase modal (when no credits) ──── */

interface PurchaseModalProps {
  classSlug: string;
  sessionId?: string;
  className: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function PurchaseModal({
  classSlug,
  sessionId,
  className,
  onSuccess,
  onClose,
}: PurchaseModalProps) {
  const { membership, referralBalance } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [pricing, setPricing] = useState<PublicPricingDto | null>(null);

  const hasMembership = !!membership;
  const discount = referralBalance;

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/public/pricing", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as PublicPricingDto;
        if (active) setPricing(payload);
      } catch {
        // Keep fallback prices in UI.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const moveWellMonthlyPrice =
    pricing?.membershipDisplay?.movewellMonthly ?? pricing?.membership.movewell ?? 29;
  const credits1Price = pricing?.credits[1] ?? 9;
  const credits3Price = pricing?.credits[3] ?? 24;
  const credits10Price = pricing?.credits[10] ?? 70;

  /** Format a price with optional referral discount struck-through */
  const priceLabel = (basePrice: number) => {
    if (discount > 0) {
      const discounted = Math.max(0, basePrice - discount);
      return (
        <span>
          <span className="text-muted-foreground mr-1 line-through">£{basePrice}</span>
          <span className="text-brand-accent">£{discounted}</span>
        </span>
      );
    }
    return <span>£{basePrice}</span>;
  };

  const buildReturnPath = (checkoutStatus: "success" | "cancelled") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("checkout", checkoutStatus);
    if (checkoutStatus === "success") {
      params.set("autobook", "1");
      params.set("autobookClass", classSlug);
      if (sessionId) {
        params.set("autobookSessionId", sessionId);
      }
    } else {
      params.delete("autobook");
      params.delete("autobookClass");
      params.delete("autobookSessionId");
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const startCheckout = async (option: "dropin" | "3pack" | "10pack" | "membership") => {
    setPurchasing(true);
    setPurchaseError("");

    try {
      const request =
        option === "membership"
          ? {
              url: "/api/me/membership/checkout",
              body: {
                plan: "movewell",
                billingInterval: "monthly",
                successPath: buildReturnPath("success"),
                cancelPath: buildReturnPath("cancelled"),
              },
            }
          : {
              url: "/api/me/credits/checkout",
              body: {
                bundleSize: option === "dropin" ? 1 : option === "3pack" ? 3 : 10,
                successPath: buildReturnPath("success"),
                cancelPath: buildReturnPath("cancelled"),
              },
            };

      const response = await fetch(request.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request.body),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || "Could not start checkout.");
      }

      const payload = (await response.json()) as CheckoutResult;
      onSuccess();
      window.location.href = payload.checkoutUrl;
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : "Could not start checkout.");
      setPurchasing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-background animate-in fade-in zoom-in max-h-[90vh] w-full max-w-md space-y-6 overflow-y-auto rounded-lg border p-6 shadow-xl duration-200 md:p-8">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="mb-1 text-xl">
              {hasMembership
                ? "You've used all your classes this week"
                : "Choose how you'd like to attend"}
            </h3>
            <p className="text-muted-foreground text-sm">{className}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {purchasing ? (
          <div className="space-y-4 py-12 text-center">
            <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
            <p className="text-muted-foreground">Processing...</p>
          </div>
        ) : hasMembership ? (
          /* ── Member who's used weekly allowance ── */
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your {membership!.label} includes{" "}
              {membership!.classesPerWeek === 99 ? "unlimited" : membership!.classesPerWeek} classes
              per week and you've used them all. You can add an extra class with a credit pack.
            </p>

            {discount > 0 && (
              <div className="border-brand-accent/20 bg-brand-accent/5 text-brand-accent rounded-lg border px-4 py-3 text-sm">
                £{discount} referral balance will be applied to your purchase.
              </div>
            )}

            {/* Credit pack — primary option for members */}
            <div className="border-primary relative space-y-3 rounded-lg border-2 p-4">
              <div className="bg-primary text-primary-foreground absolute -top-3 left-4 rounded px-2 py-0.5 text-xs">
                Extra Class
              </div>
              <div>
                <h4 className="text-lg">Credit Pack</h4>
                <p className="text-muted-foreground text-sm">
                  Credits carry over — use them any week you need extra.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => void startCheckout("3pack")}
                >
                  3 classes · {priceLabel(credits3Price)}
                </Button>
                <Button size="sm" className="flex-1" onClick={() => void startCheckout("10pack")}>
                  10 classes · {priceLabel(credits10Price)}
                </Button>
              </div>
            </div>

            {/* Single drop-in */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg">Single Extra Class</h4>
                  <p className="text-muted-foreground text-sm">Just this once.</p>
                </div>
                <Button variant="outline" onClick={() => void startCheckout("dropin")}>
                  {priceLabel(credits1Price)}
                </Button>
              </div>
            </div>

            {/* Upgrade suggestion for capped memberships */}
            {membership!.plan !== "movewell" && (
              <div className="bg-secondary/20 space-y-2 rounded-lg border p-4">
                <p className="text-muted-foreground text-sm">
                  Running out of classes regularly? Consider upgrading your plan.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onClose();
                    window.location.href = "/dashboard/membership";
                  }}
                >
                  View Plans
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            <p className="text-muted-foreground text-xs leading-relaxed">
              By continuing to payment, you agree to the{" "}
              <a href="/terms" className="text-primary underline">
                Terms & Conditions
              </a>{" "}
              and can review the{" "}
              <a href="/refund-policy" className="text-primary underline">
                Refund & Cancellation Policy
              </a>
              .
            </p>
          </div>
        ) : (
          /* ── Non-member ── */
          <div className="space-y-4">
            {discount > 0 && (
              <div className="border-brand-accent/20 bg-brand-accent/5 text-brand-accent rounded-lg border px-4 py-3 text-sm">
                £{discount} referral balance will be applied to your purchase.
              </div>
            )}

            {/* Move Well membership — recommended for non-members */}
            <div className="border-primary relative space-y-3 rounded-lg border-2 p-4">
              <div className="bg-primary text-primary-foreground absolute -top-3 left-4 rounded px-2 py-0.5 text-xs">
                Recommended
              </div>
              <div>
                <h4 className="text-lg">Move Well Membership</h4>
                <p className="text-muted-foreground text-sm">
                  Unlimited classes, cancel anytime. Includes a 14-day trial with first charge after
                  trial unless cancelled.
                </p>
              </div>
              <Button size="sm" className="w-full" onClick={() => void startCheckout("membership")}>
                Join · {priceLabel(moveWellMonthlyPrice)}/month
              </Button>
            </div>

            {/* Credit pack */}
            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <h4 className="text-lg">Credit Pack</h4>
                <p className="text-muted-foreground text-sm">Flexible credits, use on any class.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => void startCheckout("3pack")}
                >
                  3 classes · {priceLabel(credits3Price)}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => void startCheckout("10pack")}
                >
                  10 classes · {priceLabel(credits10Price)}
                </Button>
              </div>
            </div>

            {/* Single drop-in */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg">Single Drop-In</h4>
                  <p className="text-muted-foreground text-sm">
                    Try a single class, no commitment.
                  </p>
                </div>
                <Button variant="outline" onClick={() => void startCheckout("dropin")}>
                  {priceLabel(credits1Price)}
                </Button>
              </div>
            </div>

            <p className="text-muted-foreground text-xs leading-relaxed">
              By continuing to payment, you agree to the{" "}
              <a href="/terms" className="text-primary underline">
                Terms & Conditions
              </a>{" "}
              and can review the{" "}
              <a href="/refund-policy" className="text-primary underline">
                Refund & Cancellation Policy
              </a>
              .
            </p>
          </div>
        )}

        {purchaseError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {purchaseError}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ──── Main BookClass button with full flow ──── */

interface BookClassButtonProps {
  sessionId?: string;
  isBooked?: boolean;
  classSlug: string;
  label?: string;
  /** Optional display metadata for confirmation/schedule labels */
  className?: string;
  day?: string;
  time?: string;
  duration?: string;
  variant?: "default" | "outline" | "lg";
  size?: "default" | "sm" | "lg" | "icon";
  attendeeCount?: number;
}

export function BookClassButton({
  sessionId,
  isBooked: isBookedProp = false,
  classSlug,
  label,
  className: classNameProp,
  day: dayProp,
  time: timeProp,
  duration: durationProp,
  variant = "default",
  size: sizeProp,
  attendeeCount = 5,
}: BookClassButtonProps) {
  const { isAuthenticated, refreshMembershipState } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showPurchase, setShowPurchase] = useState(false);
  const [confirmation, setConfirmation] = useState<{ creditUsed: CreditItem } | null>(null);
  const [bookingState, setBookingState] = useState<"idle" | "loading" | "waitlisted">("idle");
  const [bookedOverride, setBookedOverride] = useState(false);
  const [resolvedSessionId, setResolvedSessionId] = useState<string | null>(sessionId ?? null);
  const autoBookingAttemptedRef = useRef(false);

  const className = classNameProp || classSlug;
  const day = dayProp || "Monday";
  const time = timeProp || "09:00";
  const duration = durationProp || "60 min";

  const effectiveSessionId = sessionId || resolvedSessionId || undefined;
  const booked = bookedOverride || isBookedProp;

  // Check 90-minute rule
  const nextClass = getNextClassDatetime(day, time);
  const now = new Date();
  const minutesUntilStart = (nextClass.getTime() - now.getTime()) / (1000 * 60);
  const isCancelledDueToLowEnrollment =
    minutesUntilStart <= 90 && minutesUntilStart > 0 && attendeeCount === 0;

  const effectiveSize = sizeProp || (variant === "lg" ? "lg" : "default");

  const clearCheckoutIntent = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("checkout");
    params.delete("autobook");
    params.delete("autobookClass");
    params.delete("autobookSessionId");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const attemptBooking = useCallback(
    async ({
      preferredSessionId,
      openPurchaseModalOnLimit,
    }: {
      preferredSessionId?: string;
      openPurchaseModalOnLimit: boolean;
    }) => {
      setBookingState("loading");
      let targetSessionId = preferredSessionId || effectiveSessionId;
      if (!targetSessionId) {
        const sessionResponse = await fetch(
          `/api/classes/sessions?slug=${encodeURIComponent(classSlug)}&from=${encodeURIComponent(new Date().toISOString())}`,
          { cache: "no-store" }
        );
        if (sessionResponse.ok) {
          const sessionPayload = (await sessionResponse.json()) as Array<{ id: string }>;
          targetSessionId = sessionPayload[0]?.id;
        }
      }

      if (!targetSessionId) {
        setBookingState("idle");
        return "missing_session" as const;
      }

      setResolvedSessionId(targetSessionId);
      const response = await fetch(`/api/classes/sessions/${targetSessionId}/book`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        status?: "booked" | "waitlisted";
        bookingMode?: "membership" | "credit" | "waitlist" | "manual";
        message?: string;
      };

      if (!response.ok) {
        if (payload.message === "BOOKING_LIMIT_REACHED" && openPurchaseModalOnLimit) {
          setShowPurchase(true);
        }
        setBookingState("idle");
        return payload.message === "BOOKING_LIMIT_REACHED"
          ? ("limit_reached" as const)
          : ("failed" as const);
      }

      if (payload.status === "waitlisted") {
        setBookingState("waitlisted");
        await refreshMembershipState();
        return "waitlisted" as const;
      }

      const creditUsed: CreditItem = {
        id: `session_${targetSessionId}`,
        type: payload.bookingMode === "credit" ? "purchased" : "membership",
        label:
          payload.bookingMode === "credit"
            ? "Class credit"
            : payload.bookingMode === "manual"
              ? "Instructor booking"
              : "Membership class",
        sourceId: payload.bookingMode === "credit" ? "credit" : "membership",
        sourceLabel: payload.bookingMode === "credit" ? "Purchased credits" : "Membership",
      };
      setConfirmation({ creditUsed });
      setBookedOverride(true);
      setBookingState("idle");
      await refreshMembershipState();
      return "booked" as const;
    },
    [classSlug, effectiveSessionId, refreshMembershipState]
  );

  const handleBook = () => {
    if (isCancelledDueToLowEnrollment) return;

    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?redirect=${returnUrl}&intent=book`);
      return;
    }

    const run = async () => {
      await attemptBooking({
        preferredSessionId: effectiveSessionId,
        openPurchaseModalOnLimit: true,
      });
    };

    void run();
  };

  useEffect(() => {
    const checkoutStatus = searchParams.get("checkout");
    const shouldAutoBook = searchParams.get("autobook") === "1";
    const targetClassSlug = searchParams.get("autobookClass");
    const targetSessionId = searchParams.get("autobookSessionId") || undefined;

    if (
      !isAuthenticated ||
      autoBookingAttemptedRef.current ||
      checkoutStatus !== "success" ||
      !shouldAutoBook ||
      targetClassSlug !== classSlug
    ) {
      return;
    }

    if (targetSessionId && effectiveSessionId && targetSessionId !== effectiveSessionId) {
      return;
    }

    autoBookingAttemptedRef.current = true;

    void (async () => {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        await refreshMembershipState();
        const result = await attemptBooking({
          preferredSessionId: targetSessionId,
          openPurchaseModalOnLimit: false,
        });

        if (result === "booked" || result === "waitlisted" || result === "failed") {
          break;
        }

        if (result !== "limit_reached") {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      clearCheckoutIntent();
    })();
  }, [
    attemptBooking,
    classSlug,
    clearCheckoutIntent,
    effectiveSessionId,
    isAuthenticated,
    refreshMembershipState,
    searchParams,
  ]);

  if (bookingState === "waitlisted") {
    return (
      <Button
        variant="outline"
        disabled
        size={effectiveSize}
        className={variant === "lg" ? "px-8 text-lg" : ""}
      >
        Waitlisted
      </Button>
    );
  }

  if (booked) {
    return (
      <Button
        variant="outline"
        disabled
        size={effectiveSize}
        className={variant === "lg" ? "px-8 text-lg" : ""}
      >
        <Check className="mr-2 h-4 w-4" />
        Booked
      </Button>
    );
  }

  if (isCancelledDueToLowEnrollment) {
    return (
      <div className="group relative inline-block">
        <Button
          disabled
          variant="outline"
          className={`cursor-not-allowed opacity-50 ${variant === "lg" ? "px-8 text-lg" : ""}`}
        >
          <AlertCircle className="mr-2 h-4 w-4" />
          Class Cancelled
        </Button>
        <div className="bg-popover text-popover-foreground absolute bottom-full left-1/2 z-50 mb-2 hidden w-64 -translate-x-1/2 rounded border p-2 text-center text-xs shadow-md group-hover:block">
          This class has been cancelled due to low enrollment (no bookings 90 mins before start).
        </div>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={handleBook}
        disabled={bookingState === "loading"}
        size={effectiveSize}
        className={variant === "lg" ? "px-8 text-lg" : ""}
      >
        {bookingState === "loading"
          ? "Booking..."
          : label || (effectiveSize === "sm" ? "Book" : "Book This Class")}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>

      {showPurchase && (
        <PurchaseModal
          classSlug={classSlug}
          sessionId={effectiveSessionId}
          className={className}
          onSuccess={() => {
            setShowPurchase(false);
          }}
          onClose={() => setShowPurchase(false)}
        />
      )}

      {confirmation && (
        <BookingConfirmation
          className={className}
          day={day}
          time={time}
          duration={duration}
          creditUsed={confirmation.creditUsed}
          onClose={() => setConfirmation(null)}
        />
      )}
    </>
  );
}
