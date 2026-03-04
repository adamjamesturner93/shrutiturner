"use client";

import { DashboardLayout } from "../../components/dashboard-layout";
import { useAuth, PLAN_PRICES, BUNDLE_PRICES } from "../../context/auth-context";
import { useI18n } from "../../lib/use-i18n";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useState } from "react";
import { CreditCard, Gift, AlertTriangle, Clock } from "lucide-react";

export function MembershipPage() {
  const {
    membership,
    credits,
    creditSummary,
    totalCredits,
    membershipClassesRemaining,
    upgradeMembership,
    cancelMembership,
    purchaseCredits,
    referralBalance,
    spendReferralBalance,
    creditExpiryDate,
    creditsExpiringSoon,
  } = useAuth();
  const { fmtDate } = useI18n();
  const [showCancel, setShowCancel] = useState(false);

  // Instructors have unlimited access — no membership management needed
  if (membership?.plan === "instructor") {
    return (
      <DashboardLayout title="Membership - Private Studio">
        <h1 className="mb-2 text-3xl">Membership</h1>
        <div className="bg-background mt-8 rounded-lg border p-8 text-center">
          <CreditCard className="mx-auto mb-3 h-8 w-8 text-[#4B5B32]" />
          <p className="mb-1 text-lg">Unlimited (instructor)</p>
          <p className="text-muted-foreground text-sm">
            As an instructor, you have unlimited access to all classes. No membership or credits
            needed.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const plans = [
    {
      key: "steady" as const,
      label: "Steady",
      classes: "2/week",
      price: PLAN_PRICES.steady,
      perClass: "~£6",
    },
    {
      key: "committed" as const,
      label: "Committed",
      classes: "3/week",
      price: PLAN_PRICES.committed,
      perClass: "~£5",
      popular: true,
    },
    {
      key: "unlimited" as const,
      label: "Unlimited",
      classes: "All classes",
      price: PLAN_PRICES.unlimited,
      perClass: "Best value",
    },
  ];

  /** Format a price with optional referral discount */
  const priceWithDiscount = (basePrice: number) => {
    if (referralBalance > 0) {
      const discounted = Math.max(0, basePrice - referralBalance);
      return (
        <span>
          <span className="text-muted-foreground mr-1 line-through">£{basePrice}</span>£{discounted}
        </span>
      );
    }
    return `£${basePrice}`;
  };

  return (
    <DashboardLayout title="Membership - Private Studio">
      <h1 className="mb-2 text-3xl">Membership & Credits</h1>
      <p className="text-muted-foreground mb-8">Manage your plan, view credits, and billing.</p>

      {/* Referral balance banner */}
      {referralBalance > 0 && (
        <div className="mb-8 flex items-start gap-3 rounded-lg border border-[#4B5B32]/20 bg-[#4B5B32]/5 p-4">
          <Gift className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#4B5B32]" />
          <div>
            <p className="text-sm">
              You have <span className="text-[#4B5B32]">£{referralBalance}</span> referral balance.
            </p>
            <p className="text-muted-foreground mt-1 text-xs">Applies to next purchase</p>
          </div>
        </div>
      )}

      {/* Current plan */}
      <div className="bg-background mb-8 rounded-lg border p-6">
        <h2 className="mb-4 text-xl">Current Plan</h2>
        {membership ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg">{membership.label}</p>
                <p className="text-muted-foreground text-sm">
                  Renews {fmtDate(membership.renewalDate)}
                  {" · "}
                  {referralBalance > 0 ? (
                    <span>
                      <span className="line-through">£{membership.price}</span>{" "}
                      <span className="text-[#4B5B32]">
                        £{Math.max(0, membership.price - referralBalance)}
                      </span>
                    </span>
                  ) : (
                    `£${membership.price}`
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-sm">This week</p>
                <p className="text-2xl">
                  {membershipClassesRemaining}
                  <span className="text-muted-foreground text-sm">
                    {" "}
                    / {membership.classesPerWeek === 99 ? "∞" : membership.classesPerWeek}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => setShowCancel(true)}
              >
                Cancel Plan
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-muted-foreground mb-4">
              No active membership. Choose a plan below or use credit packs.
            </p>
          </div>
        )}
      </div>

      {/* Cancel confirmation */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-background w-full max-w-sm space-y-4 rounded-lg border p-6 shadow-xl">
            <h3 className="text-xl">Cancel your membership?</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your membership will remain active until the renewal date. After that, you can still
              attend using credit packs.
            </p>
            {totalCredits > 0 && (
              <p className="text-muted-foreground text-sm">
                You have {totalCredits} purchased credit{totalCredits !== 1 ? "s" : ""} that will
                remain available.
              </p>
            )}
            {referralBalance > 0 && (
              <p className="text-muted-foreground text-sm">
                Your £{referralBalance} referral balance will carry over and apply to your next
                purchase.
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  cancelMembership();
                  if (totalCredits === 0) {
                    purchaseCredits(3);
                  }
                  setShowCancel(false);
                }}
              >
                {totalCredits === 0 ? (
                  <>Cancel & Switch to 3-Class Pack ({priceWithDiscount(30)})</>
                ) : (
                  "Cancel Membership"
                )}
              </Button>
              {totalCredits === 0 && (
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => {
                    cancelMembership();
                    setShowCancel(false);
                  }}
                >
                  Cancel without replacement
                </Button>
              )}
              <Button variant="ghost" onClick={() => setShowCancel(false)}>
                Keep my membership
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Available plans */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl">{membership ? "Switch Plan" : "Choose a Plan"}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = membership?.plan === plan.key;
            return (
              <div
                key={plan.key}
                className={`relative space-y-4 rounded-lg border p-5 ${
                  plan.popular ? "border-primary border-2" : ""
                } ${isCurrent ? "bg-primary/5" : ""}`}
              >
                {plan.popular && (
                  <div className="bg-primary text-primary-foreground absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs">
                    Most Popular
                  </div>
                )}
                <div>
                  <h3 className="text-lg">{plan.label}</h3>
                  <p className="text-muted-foreground text-sm">{plan.classes}</p>
                </div>
                <div>
                  <p className="text-2xl">
                    {referralBalance > 0 && !isCurrent ? (
                      <span>
                        <span className="text-muted-foreground mr-1 line-through">
                          £{plan.price}
                        </span>
                        £{Math.max(0, plan.price - referralBalance)}
                      </span>
                    ) : (
                      `£${plan.price}`
                    )}
                    <span className="text-muted-foreground text-sm">/month</span>
                  </p>
                  <p className="text-muted-foreground text-xs">{plan.perClass} per class</p>
                  {referralBalance > 0 && !isCurrent && (
                    <p className="mt-1 text-xs text-[#4B5B32]">
                      £{referralBalance} referral discount applied
                    </p>
                  )}
                </div>
                {isCurrent ? (
                  <Button variant="outline" disabled className="w-full">
                    Current Plan
                  </Button>
                ) : (
                  <>
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className="w-full"
                      onClick={() => upgradeMembership(plan.key)}
                    >
                      {membership ? "Switch" : "Start 14-Day Free Trial"}
                    </Button>
                    {!membership && (
                      <p className="text-muted-foreground text-center text-xs">
                        No payment taken during trial
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Credit balance — grouped */}
      <div className="bg-background mb-8 rounded-lg border p-6">
        <h2 className="mb-4 text-xl">Credit Balance</h2>

        {/* Credit expiry warning */}
        {creditExpiryDate &&
          (() => {
            const daysLeft = Math.ceil(
              (new Date(creditExpiryDate).getTime() - Date.now()) / 86400000
            );
            if (daysLeft > 14) return null;
            return (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <p className="text-sm text-amber-800">
                  {creditsExpiringSoon} credit{creditsExpiringSoon !== 1 ? "s" : ""}{" "}
                  {daysLeft <= 0
                    ? "expired today"
                    : daysLeft === 1
                      ? "will expire tomorrow"
                      : `will expire in ${daysLeft} days`}{" "}
                  ({fmtDate(creditExpiryDate)}). Purchasing more credits will extend the expiry
                  window for all credits.
                </p>
              </div>
            );
          })()}

        {creditSummary.length > 0 ? (
          <div className="mb-6 space-y-3">
            {creditSummary.map((group) => (
              <div
                key={group.sourceId}
                className="flex items-center justify-between border-b py-3 text-sm last:border-0"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                  <div>
                    <span>{group.sourceLabel}</span>
                    <p className="text-muted-foreground text-xs">
                      {group.expiresAt ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expires {fmtDate(group.expiresAt)}
                        </span>
                      ) : (
                        "Purchased"
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline">
                    {group.remaining} credit{group.remaining !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground mb-6 text-sm">No class credits available.</p>
        )}

        {/* Contextual purchase options */}
        {membership ? (
          <div className="border-t pt-4">
            <p className="text-muted-foreground mb-3 text-sm">
              Need extra classes beyond your{" "}
              {membership.classesPerWeek === 99 ? "unlimited" : `${membership.classesPerWeek}/week`}{" "}
              allowance? Purchase additional credits.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={() => purchaseCredits(3)}>
                3-Pack ({priceWithDiscount(30)})
              </Button>
              <Button variant="outline" size="sm" onClick={() => purchaseCredits(10)}>
                10-Pack ({priceWithDiscount(90)})
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-t pt-4">
            <p className="text-muted-foreground mb-3 text-sm">
              No membership? Use credit packs to attend any class.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" onClick={() => purchaseCredits(1)}>
                Drop-In ({priceWithDiscount(12)})
              </Button>
              <Button variant="outline" size="sm" onClick={() => purchaseCredits(3)}>
                3-Pack ({priceWithDiscount(30)})
              </Button>
              <Button variant="outline" size="sm" onClick={() => purchaseCredits(10)}>
                10-Pack ({priceWithDiscount(90)})
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Billing history placeholder */}
      <div className="bg-background rounded-lg border p-6">
        <h2 className="mb-4 text-xl">Billing History</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b py-2">
            <span className="text-muted-foreground">Committed Membership — Feb 2026</span>
            <span>£65.00</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-muted-foreground">
              Committed Membership — Jan 2026
              <span className="ml-1 text-[#4B5B32]">(£10 referral applied)</span>
            </span>
            <span>£55.00</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-muted-foreground">10-Class Bundle — Jan 2026</span>
            <span>£90.00</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">
              Committed Membership — Dec 2025
              <span className="ml-1 text-[#4B5B32]">(£10 referral applied)</span>
            </span>
            <span>£55.00</span>
          </div>
        </div>
        <p className="text-muted-foreground mt-4 text-xs italic">
          [Placeholder billing data — Stripe integration required]
        </p>
      </div>
    </DashboardLayout>
  );
}
