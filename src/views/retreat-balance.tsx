"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, ExternalLink, MapPin } from "lucide-react";
import { Layout } from "@/components/layout";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type RetreatBalanceState = {
  bookingId: string;
  retreatSlug: string;
  retreatTitle: string;
  retreatLocation: string;
  dateLabel: string;
  purchaserName: string;
  balanceAmountPence: number;
  currency: string;
  paymentStatus: string;
  dueDate: string | null;
};

function formatCurrency(pence: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(pence / 100);
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function RetreatBalancePage({
  token,
  initialData,
}: {
  token: string;
  initialData?: RetreatBalanceState | null;
}) {
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const checkoutState = searchParams.get("checkout");

  if (!initialData) {
    return (
      <Layout>
        <SEO title="Retreat Balance Payment" noIndex />
        <section className="section-wash min-h-[calc(100dvh-4rem)] px-4 py-10 md:py-14">
          <div className="container mx-auto flex min-h-[calc(100dvh-12rem)] max-w-3xl items-center">
            <div className="marketing-panel w-full rounded-[2rem] px-6 py-10 text-center md:px-10">
              <h1 className="mb-4 text-3xl md:text-4xl">Balance link unavailable</h1>
              <p className="text-muted-foreground">
                This payment link is missing or has expired. Contact us if you need a new one.
              </p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  const handlePayBalance = async () => {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(
        `/api/retreats/bookings/${initialData.bookingId}/balance-checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }
      );
      const payload = (await response.json().catch(() => null)) as {
        checkoutUrl?: string;
        message?: string;
      } | null;
      if (!response.ok || !payload?.checkoutUrl) {
        throw new Error(payload?.message || "Failed to start balance checkout.");
      }
      window.location.href = payload.checkoutUrl;
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to start balance checkout."
      );
      setSubmitting(false);
    }
  };

  const isPaid = initialData.paymentStatus === "paid_in_full";

  return (
    <Layout>
      <SEO title={`${initialData.retreatTitle} Balance Payment`} noIndex />

      <section className="marketing-grid text-brand-white overflow-hidden px-4 py-10 md:py-14">
        <div className="container mx-auto max-w-6xl">
          <Link
            href={`/retreats/${initialData.retreatSlug}`}
            className="text-brand-accent-light mb-4 inline-flex items-center gap-2 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to retreat details
          </Link>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_0.88fr] lg:items-center lg:gap-10">
            <div>
              <h1 className="text-4xl leading-tight md:text-5xl">Retreat Balance Payment</h1>
              <p className="text-brand-white/80 mt-4 max-w-2xl text-lg leading-relaxed">
                Use this secure link to settle the remaining balance for your retreat booking.
              </p>
            </div>

            <div className="border-brand-white/10 bg-brand-white/8 overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <div className="bg-brand-white/8 rounded-[1.45rem] p-6">
                <p className="text-brand-accent-light text-xs tracking-[0.18em] uppercase">
                  Booking
                </p>
                <h2 className="mt-3 text-2xl">{initialData.retreatTitle}</h2>
                <p className="text-brand-white/82 mt-3 text-sm leading-relaxed">
                  {initialData.retreatLocation} · {initialData.dateLabel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-wash px-4 py-10 md:py-14">
        <div className="container mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            {checkoutState === "success" ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                Your balance payment has been received.
              </div>
            ) : null}
            {checkoutState === "cancelled" ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Balance checkout was cancelled. You can use the button below whenever you're ready.
              </div>
            ) : null}
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="marketing-panel rounded-[1.75rem] p-6">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl">{initialData.retreatTitle}</h2>
                <Badge variant={isPaid ? "default" : "secondary"}>
                  {isPaid ? "Paid in full" : "Balance due"}
                </Badge>
              </div>
              <div className="text-muted-foreground space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {initialData.retreatLocation}
                </p>
                <p>{initialData.dateLabel}</p>
                <p>Booking name: {initialData.purchaserName}</p>
                {initialData.dueDate ? <p>Due by: {formatDate(initialData.dueDate)}</p> : null}
              </div>
            </div>

            <div className="border-brand-dark/10 bg-background rounded-[1.75rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.05)]">
              <h3 className="mb-3 text-xl">What happens after payment</h3>
              <ul className="text-muted-foreground space-y-2 text-sm leading-relaxed">
                <li>1. Stripe takes payment securely.</li>
                <li>2. Your retreat booking updates to paid in full automatically.</li>
                <li>
                  3. You can still access the booking from your dashboard if it is linked to your
                  account.
                </li>
              </ul>
            </div>
          </div>

          <div>
            <div className="marketing-panel sticky top-24 rounded-[1.75rem] p-6 shadow-sm">
              <p className="text-muted-foreground text-sm">Balance remaining</p>
              <p className="mt-2 text-4xl">
                {formatCurrency(initialData.balanceAmountPence, initialData.currency)}
              </p>
              {initialData.dueDate ? (
                <p className="text-muted-foreground mt-2 text-sm">
                  Due by {formatDate(initialData.dueDate)}
                </p>
              ) : null}

              <div className="mt-6 space-y-3">
                <Button
                  className="w-full"
                  disabled={submitting || isPaid || initialData.balanceAmountPence <= 0}
                  onClick={() => void handlePayBalance()}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {isPaid ? "Already paid" : submitting ? "Redirecting..." : "Pay balance now"}
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/retreats/${initialData.retreatSlug}`}>
                    View retreat details
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
