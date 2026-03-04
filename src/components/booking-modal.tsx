import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  Check,
  CreditCard,
  CalendarPlus,
  ArrowRight,
  AlertCircle,
  Download,
} from "lucide-react";
import { Button } from "./ui/button";
import { useAuth, type CreditItem } from "../context/auth-context";
import { useI18n } from "../lib/use-i18n";
import { classDetails } from "../data/schedule-data";

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
  creditUsed: CreditItem;
  onClose: () => void;
}

export function BookingConfirmation({
  className,
  day,
  time,
  creditUsed,
  onClose,
}: BookingConfirmationProps) {
  const { fmtTimeStr } = useI18n();
  const creditLabel =
    creditUsed.type === "membership"
      ? `Membership class (${creditUsed.label})`
      : `Purchased credit — ${creditUsed.sourceLabel}`;

  // Look up duration from class details
  const cls = classDetails.find((c) => c.name === className);
  const duration = cls?.duration || "60 min";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-background animate-in fade-in zoom-in w-full max-w-sm space-y-6 rounded-lg border p-8 text-center shadow-xl duration-200">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4B5B32]/10">
          <Check className="h-8 w-8 text-[#4B5B32]" />
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
  className: string;
  onSuccess: (creditUsed: CreditItem) => void;
  onClose: () => void;
}

export function PurchaseModal({ classSlug, className, onSuccess, onClose }: PurchaseModalProps) {
  const {
    membership,
    purchaseDropIn,
    purchaseCredits,
    upgradeMembership,
    bookClass,
    referralBalance,
  } = useAuth();
  const [purchasing, setPurchasing] = useState(false);

  const hasMembership = !!membership;
  const discount = referralBalance;

  /** Format a price with optional referral discount struck-through */
  const priceLabel = (basePrice: number) => {
    if (discount > 0) {
      const discounted = Math.max(0, basePrice - discount);
      return (
        <span>
          <span className="text-muted-foreground mr-1 line-through">£{basePrice}</span>
          <span className="text-[#4B5B32]">£{discounted}</span>
        </span>
      );
    }
    return <span>£{basePrice}</span>;
  };

  const handlePurchase = (
    option: "dropin" | "3pack" | "10pack" | "steady" | "committed" | "unlimited"
  ) => {
    setPurchasing(true);
    setTimeout(() => {
      switch (option) {
        case "dropin":
          purchaseDropIn();
          break;
        case "3pack":
          purchaseCredits(3);
          break;
        case "10pack":
          purchaseCredits(10);
          break;
        case "steady":
          upgradeMembership("steady");
          break;
        case "committed":
          upgradeMembership("committed");
          break;
        case "unlimited":
          upgradeMembership("unlimited");
          break;
      }
      setTimeout(() => {
        const result = bookClass(classSlug);
        if (result.success && result.creditUsed) {
          onSuccess(result.creditUsed);
        }
        setPurchasing(false);
      }, 100);
    }, 800);
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
              <div className="rounded-lg border border-[#4B5B32]/20 bg-[#4B5B32]/5 px-4 py-3 text-sm text-[#4B5B32]">
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
                  onClick={() => handlePurchase("3pack")}
                >
                  3 classes · {priceLabel(30)}
                </Button>
                <Button size="sm" className="flex-1" onClick={() => handlePurchase("10pack")}>
                  10 classes · {priceLabel(90)}
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
                <Button variant="outline" onClick={() => handlePurchase("dropin")}>
                  {priceLabel(12)}
                </Button>
              </div>
            </div>

            {/* Upgrade suggestion (only if not already unlimited) */}
            {membership!.plan !== "unlimited" && (
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
          </div>
        ) : (
          /* ── Non-member ── */
          <div className="space-y-4">
            {discount > 0 && (
              <div className="rounded-lg border border-[#4B5B32]/20 bg-[#4B5B32]/5 px-4 py-3 text-sm text-[#4B5B32]">
                £{discount} referral balance will be applied to your purchase.
              </div>
            )}

            {/* Monthly membership — recommended for non-members */}
            <div className="border-primary relative space-y-3 rounded-lg border-2 p-4">
              <div className="bg-primary text-primary-foreground absolute -top-3 left-4 rounded px-2 py-0.5 text-xs">
                Recommended
              </div>
              <div>
                <h4 className="text-lg">Monthly Membership</h4>
                <p className="text-muted-foreground text-sm">
                  Best value for regular training. Cancel anytime.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handlePurchase("steady")}
                >
                  2/week · {priceLabel(49)}
                </Button>
                <Button size="sm" className="flex-1" onClick={() => handlePurchase("committed")}>
                  3/week · {priceLabel(65)}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handlePurchase("unlimited")}
                >
                  All · {priceLabel(79)}
                </Button>
              </div>
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
                  onClick={() => handlePurchase("3pack")}
                >
                  3 classes · {priceLabel(30)}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handlePurchase("10pack")}
                >
                  10 classes · {priceLabel(90)}
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
                <Button variant="outline" onClick={() => handlePurchase("dropin")}>
                  {priceLabel(12)}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──── Main BookClass button with full flow ──── */

interface BookClassButtonProps {
  classSlug: string;
  /** These can be omitted — the component will look up from classDetails */
  className?: string;
  day?: string;
  time?: string;
  variant?: "default" | "outline" | "lg";
  size?: "default" | "sm" | "lg" | "icon";
  attendeeCount?: number;
}

export function BookClassButton({
  classSlug,
  className: classNameProp,
  day: dayProp,
  time: timeProp,
  variant = "default",
  size: sizeProp,
  attendeeCount = 5,
}: BookClassButtonProps) {
  const { isAuthenticated, canBook, bookClass, isClassBooked } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showPurchase, setShowPurchase] = useState(false);
  const [confirmation, setConfirmation] = useState<{ creditUsed: CreditItem } | null>(null);

  // Auto-lookup class details if not provided
  const cls = classDetails.find((c) => c.slug === classSlug);
  const className = classNameProp || cls?.name || classSlug;
  const day = dayProp || cls?.day || "Monday";
  const time = timeProp || cls?.time || "09:00";

  const booked = isClassBooked(classSlug);

  // Check 90-minute rule
  const nextClass = getNextClassDatetime(day, time);
  const now = new Date();
  const minutesUntilStart = (nextClass.getTime() - now.getTime()) / (1000 * 60);
  const isCancelledDueToLowEnrollment =
    minutesUntilStart <= 90 && minutesUntilStart > 0 && attendeeCount === 0;

  const effectiveSize = sizeProp || (variant === "lg" ? "lg" : "default");

  const handleBook = () => {
    if (isCancelledDueToLowEnrollment) return;

    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?redirect=${returnUrl}&intent=book`);
      return;
    }

    const { allowed } = canBook();
    if (allowed) {
      const result = bookClass(classSlug);
      if (result.success && result.creditUsed) {
        setConfirmation({ creditUsed: result.creditUsed });
      }
    } else {
      setShowPurchase(true);
    }
  };

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
        size={effectiveSize}
        className={variant === "lg" ? "px-8 text-lg" : ""}
      >
        {effectiveSize === "sm" ? "Book" : "Book This Class"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>

      {showPurchase && (
        <PurchaseModal
          classSlug={classSlug}
          className={className}
          onSuccess={(creditUsed) => {
            setShowPurchase(false);
            setConfirmation({ creditUsed });
          }}
          onClose={() => setShowPurchase(false)}
        />
      )}

      {confirmation && (
        <BookingConfirmation
          className={className}
          day={day}
          time={time}
          creditUsed={confirmation.creditUsed}
          onClose={() => setConfirmation(null)}
        />
      )}
    </>
  );
}
