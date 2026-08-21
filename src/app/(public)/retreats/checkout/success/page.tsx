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
  const loginHref = `/login?intent=online-workshop&email=${encodeURIComponent(state.email)}&redirect=${encodeURIComponent(destination)}`;

  return (
    <Layout footerVariant="utility">
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
            Thanks {state.firstName}. Your {state.kind === "gift" ? "gift for" : "place on"}{" "}
            {state.title} has been recorded. A confirmation email is on its way.
          </p>
          {state.kind === "gift" ? (
            <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-sm leading-relaxed">
              The recipient will use their own account for health agreements and workshop access.
              Sign in with the purchase email to track the gift or request cancellation.
            </p>
          ) : state.isOnline ? (
            <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-sm leading-relaxed">
              Your next step is the short workshop setup for your date of birth, health profile and
              current agreements.
            </p>
          ) : null}
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href={session?.user?.id ? destination : loginHref}>
                <UserRoundCheck className="mr-2 h-4 w-4" />
                {session?.user?.id ? "Continue" : "Sign in or create account"}
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
