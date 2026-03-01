"use client";

import { DashboardLayout } from "../../components/dashboard-layout";
import { useAuth, PLAN_PRICES, BUNDLE_PRICES } from "../../context/auth-context";
import { useI18n } from "../../lib/use-i18n";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useState } from "react";
import {
  CreditCard,
  Gift,
  AlertTriangle,
  Clock,
} from "lucide-react";

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
        <h1 className="text-3xl mb-2">Membership</h1>
        <div className="bg-background border rounded-lg p-8 text-center mt-8">
          <CreditCard className="w-8 h-8 text-[#4B5B32] mx-auto mb-3" />
          <p className="text-lg mb-1">Unlimited (instructor)</p>
          <p className="text-sm text-muted-foreground">
            As an instructor, you have unlimited access to all classes. No membership or credits needed.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const plans = [
    { key: "steady" as const, label: "Steady", classes: "2/week", price: PLAN_PRICES.steady, perClass: "~£6" },
    { key: "committed" as const, label: "Committed", classes: "3/week", price: PLAN_PRICES.committed, perClass: "~£5", popular: true },
    { key: "unlimited" as const, label: "Unlimited", classes: "All classes", price: PLAN_PRICES.unlimited, perClass: "Best value" },
  ];

  /** Format a price with optional referral discount */
  const priceWithDiscount = (basePrice: number) => {
    if (referralBalance > 0) {
      const discounted = Math.max(0, basePrice - referralBalance);
      return (
        <span>
          <span className="line-through text-muted-foreground mr-1">£{basePrice}</span>
          £{discounted}
        </span>
      );
    }
    return `£${basePrice}`;
  };

  return (
    <DashboardLayout title="Membership - Private Studio">
      <h1 className="text-3xl mb-2">Membership & Credits</h1>
      <p className="text-muted-foreground mb-8">
        Manage your plan, view credits, and billing.
      </p>

      {/* Referral balance banner */}
      {referralBalance > 0 && (
        <div className="bg-[#4B5B32]/5 border border-[#4B5B32]/20 rounded-lg p-4 mb-8 flex items-start gap-3">
          <Gift className="w-5 h-5 text-[#4B5B32] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm">
              You have <span className="text-[#4B5B32]">£{referralBalance}</span> referral balance.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Applies to next purchase
            </p>
          </div>
        </div>
      )}

      {/* Current plan */}
      <div className="bg-background border rounded-lg p-6 mb-8">
        <h2 className="text-xl mb-4">Current Plan</h2>
        {membership ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg">{membership.label}</p>
                <p className="text-sm text-muted-foreground">
                  Renews{" "}
                  {fmtDate(membership.renewalDate)}
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
                <p className="text-sm text-muted-foreground">This week</p>
                <p className="text-2xl">
                  {membershipClassesRemaining}
                  <span className="text-sm text-muted-foreground">
                    {" "}/ {membership.classesPerWeek === 99 ? "∞" : membership.classesPerWeek}
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
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              No active membership. Choose a plan below or use credit packs.
            </p>
          </div>
        )}
      </div>

      {/* Cancel confirmation */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-background border rounded-lg shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-xl">Cancel your membership?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your membership will remain active until the renewal date. After
              that, you can still attend using credit packs.
            </p>
            {totalCredits > 0 && (
              <p className="text-sm text-muted-foreground">
                You have {totalCredits} purchased credit{totalCredits !== 1 ? "s" : ""} that
                will remain available.
              </p>
            )}
            {referralBalance > 0 && (
              <p className="text-sm text-muted-foreground">
                Your £{referralBalance} referral balance will carry over and apply to your next purchase.
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
                {totalCredits === 0
                  ? (
                    <>Cancel & Switch to 3-Class Pack ({priceWithDiscount(30)})</>
                  )
                  : "Cancel Membership"}
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
        <h2 className="text-xl mb-4">
          {membership ? "Switch Plan" : "Choose a Plan"}
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = membership?.plan === plan.key;
            return (
              <div
                key={plan.key}
                className={`border rounded-lg p-5 space-y-4 relative ${
                  plan.popular ? "border-2 border-primary" : ""
                } ${isCurrent ? "bg-primary/5" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-0.5 rounded-full text-xs">
                    Most Popular
                  </div>
                )}
                <div>
                  <h3 className="text-lg">{plan.label}</h3>
                  <p className="text-sm text-muted-foreground">{plan.classes}</p>
                </div>
                <div>
                  <p className="text-2xl">
                    {referralBalance > 0 && !isCurrent ? (
                      <span>
                        <span className="line-through text-muted-foreground mr-1">£{plan.price}</span>
                        £{Math.max(0, plan.price - referralBalance)}
                      </span>
                    ) : (
                      `£${plan.price}`
                    )}
                    <span className="text-sm text-muted-foreground">/month</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{plan.perClass} per class</p>
                  {referralBalance > 0 && !isCurrent && (
                    <p className="text-xs text-[#4B5B32] mt-1">
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
                      <p className="text-xs text-muted-foreground text-center">
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
      <div className="bg-background border rounded-lg p-6 mb-8">
        <h2 className="text-xl mb-4">Credit Balance</h2>

        {/* Credit expiry warning */}
        {creditExpiryDate && (() => {
          const daysLeft = Math.ceil((new Date(creditExpiryDate).getTime() - Date.now()) / 86400000);
          if (daysLeft > 14) return null;
          return (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                {creditsExpiringSoon} credit{creditsExpiringSoon !== 1 ? "s" : ""}{" "}
                {daysLeft <= 0
                  ? "expired today"
                  : daysLeft === 1
                    ? "will expire tomorrow"
                    : `will expire in ${daysLeft} days`}
                  {" "}({fmtDate(creditExpiryDate)}).
                  Purchasing more credits will extend the expiry window for all credits.
              </p>
            </div>
          );
        })()}

        {creditSummary.length > 0 ? (
          <div className="space-y-3 mb-6">
            {creditSummary.map((group) => (
              <div
                key={group.sourceId}
                className="flex items-center justify-between text-sm py-3 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <span>{group.sourceLabel}</span>
                    <p className="text-xs text-muted-foreground">
                      {group.expiresAt ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
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
          <p className="text-sm text-muted-foreground mb-6">No class credits available.</p>
        )}

        {/* Contextual purchase options */}
        {membership ? (
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3">
              Need extra classes beyond your {membership.classesPerWeek === 99 ? "unlimited" : `${membership.classesPerWeek}/week`} allowance?
              Purchase additional credits.
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
            <p className="text-sm text-muted-foreground mb-3">
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
      <div className="bg-background border rounded-lg p-6">
        <h2 className="text-xl mb-4">Billing History</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Committed Membership — Feb 2026</span>
            <span>£65.00</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">
              Committed Membership — Jan 2026
              <span className="text-[#4B5B32] ml-1">(£10 referral applied)</span>
            </span>
            <span>£55.00</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">10-Class Bundle — Jan 2026</span>
            <span>£90.00</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">
              Committed Membership — Dec 2025
              <span className="text-[#4B5B32] ml-1">(£10 referral applied)</span>
            </span>
            <span>£55.00</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 italic">
          [Placeholder billing data — Stripe integration required]
        </p>
      </div>
    </DashboardLayout>
  );
}