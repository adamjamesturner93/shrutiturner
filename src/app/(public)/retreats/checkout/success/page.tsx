import { AnalyticsPage } from "@/components/analytics/page";
import { formatRetreatDate, formatRetreatDateTimeRange } from "@/lib/retreats/presentation";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { CheckCircle2, Gift, UserRoundCheck } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getRetreatCheckoutSuccessState } from "@/lib/retreats/checkout-success";

export const metadata: Metadata = {
  title: "Booking received",
  robots: { index: false, follow: false },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  const sessionId = Array.isArray(params.session_id) ? params.session_id[0] : params.session_id;
  if (!sessionId) notFound();
  const state = await getRetreatCheckoutSuccessState(sessionId).catch(() => null);
  if (!state) notFound();
  const session = await auth();
  const destination =
    state.kind === "booking" && state.isOnline && state.bookingId
      ? `/dashboard/retreats/${state.bookingId}/setup`
      : state.kind === "booking" && state.bookingId
        ? `/dashboard/retreats/${state.bookingId}`
        : "/dashboard/retreats";
  const money = (pence: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: state.currency }).format(
      pence / 100
    );
  const loginHref = `/login?intent=online-workshop&email=${encodeURIComponent(state.email)}&redirect=${encodeURIComponent(destination)}`;

  return (
    <Layout footerVariant="utility">
      <AnalyticsPage path="/retreats/checkout/success" purchase={state.analyticsPurchase} />
      <main className="section-wash flex-1 px-4 py-14 md:py-20">
        <div className="marketing-panel mx-auto max-w-2xl rounded-[2rem] p-7 text-center md:p-10">
          {state.kind === "gift" ? (
            <Gift className="text-brand-accent mx-auto h-11 w-11" />
          ) : (
            <CheckCircle2 className="text-brand-accent mx-auto h-11 w-11" />
          )}
          <h1 className="mt-5 text-3xl md:text-4xl">
            {state.paymentComplete ? "Payment received" : "Payment is being confirmed"}
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl leading-relaxed">
            Thanks {state.firstName}.{" "}
            {state.paymentComplete
              ? `Your payment for ${state.title} has been received. We’ll email your booking confirmation.`
              : `We’re waiting for confirmation of your payment for ${state.title}. Please don’t pay again. Your booking will be confirmed once payment is complete.`}
          </p>
          <dl className="bg-secondary/20 mt-6 space-y-3 rounded-2xl p-5 text-left text-sm">
            <div>
              <dt className="text-muted-foreground">Your experience</dt>
              <dd className="font-medium">{state.title}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Date</dt>
              <dd>{formatRetreatDateTimeRange(state.startsAt, state.endsAt, state.timezone)}</dd>
            </div>
            {state.roomLabel ? (
              <div>
                <dt className="text-muted-foreground">Room / ticket</dt>
                <dd>{state.roomLabel}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-muted-foreground">Guests</dt>
              <dd>{state.guestCount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {state.paymentComplete ? "Paid today" : "Payment awaiting confirmation"}
              </dt>
              <dd>{money(state.paidNowPence)}</dd>
            </div>
            {state.balancePence > 0 ? (
              <div>
                <dt className="text-muted-foreground">
                  Remaining balance
                  {state.balanceDueAt
                    ? ` due ${formatRetreatDate(state.balanceDueAt, state.timezone)}`
                    : ""}
                </dt>
                <dd>{money(state.balancePence)}</dd>
              </div>
            ) : null}
          </dl>
          <h2 className="mt-7 text-2xl">What happens next</h2>
          {state.kind === "gift" ? (
            <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-sm leading-relaxed">
              {state.deliveryTarget === "purchaser"
                ? "The gift email goes to you to pass on to the recipient."
                : "The gift email goes to the recipient after payment is confirmed."}{" "}
              The recipient claims their place and completes their own attendee details. Sign in
              with the purchase email to manage your gift.
            </p>
          ) : state.isOnline ? (
            <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-sm leading-relaxed">
              Your next step is the short workshop setup for your date of birth, health profile and
              current agreements.
            </p>
          ) : (
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              After payment is confirmed, open your booking in My Studio to complete your health,
              access and emergency details.
              {state.guestCount > 1
                ? " Add or check your second guest’s email and send their registration invitation. Each guest completes their own details privately."
                : " Your place is paid for separately from these preparation steps."}
            </p>
          )}
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href={session?.user?.id ? destination : loginHref}>
                <UserRoundCheck className="mr-2 h-4 w-4" />
                {session?.user?.id
                  ? state.kind === "gift"
                    ? "Manage your gift"
                    : state.guestCount > 1
                      ? "Manage guests and registration"
                      : "Complete your attendee details"
                  : "Sign in or create account"}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contact">Get help</Link>
            </Button>
          </div>
        </div>
      </main>
    </Layout>
  );
}
