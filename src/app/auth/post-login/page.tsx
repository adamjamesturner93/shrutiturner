import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { claimReferralCode } from "@/lib/referrals/referral-service";
import { sanitizeRedirectPath } from "@/lib/navigation/safe-redirect";
import {
  createCreditCheckoutSession,
  createMembershipCheckoutSession,
} from "@/lib/billing/billing-service";

interface PostLoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function buildPricingFallbackPath(params: Record<string, string | string[] | undefined>) {
  const nextParams = new URLSearchParams({ checkout: "retry" });
  const kind = first(params.kind);

  if (kind === "membership") {
    const interval = first(params.interval) === "annual" ? "annual" : "monthly";
    nextParams.set("interval", interval);
  }

  if (kind === "credits") {
    const bundle = first(params.bundle);
    if (bundle === "1" || bundle === "3" || bundle === "10") {
      nextParams.set("bundle", bundle);
    }
  }

  nextParams.set("checkoutError", "1");
  return `/dashboard/membership?${nextParams.toString()}`;
}

async function resolvePricingCheckout(
  userId: string,
  params: Record<string, string | string[] | undefined>
) {
  const kind = first(params.kind);

  if (kind === "membership") {
    const interval = first(params.interval) === "annual" ? "annual" : "monthly";
    return createMembershipCheckoutSession(userId, "movewell", interval, undefined, "movewell");
  }

  if (kind === "credits") {
    const bundleValue = first(params.bundle);
    const bundle =
      bundleValue === "1" ? 1 : bundleValue === "3" ? 3 : bundleValue === "10" ? 10 : null;
    if (bundle) {
      return createCreditCheckoutSession(userId, bundle);
    }
  }

  return null;
}

async function PostLoginRedirect({ searchParams }: PostLoginPageProps) {
  await connection();
  const [session, params] = await Promise.all([auth(), searchParams]);

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const redirectParam = sanitizeRedirectPath(first(params.redirect));
  const onboarding = first(params.onboarding) === "1";
  const refCode = first(params.ref);
  const intent = first(params.intent);

  if (refCode) {
    await claimReferralCode(session.user.id, refCode).catch(() => null);
  }

  if (intent === "pricing-checkout") {
    try {
      const checkout = await resolvePricingCheckout(session.user.id, params);
      if (checkout?.checkoutUrl) {
        redirect(checkout.checkoutUrl);
      }
    } catch {
      redirect(buildPricingFallbackPath(params));
    }
  }

  if (redirectParam) {
    redirect(redirectParam);
  }

  if (role === "admin") {
    redirect("/admin");
  }

  redirect(onboarding ? "/dashboard?onboarding=true" : "/dashboard");
  return null;
}

export default function PostLoginPage({ searchParams }: PostLoginPageProps) {
  return (
    <Suspense fallback={null}>
      <PostLoginRedirect searchParams={searchParams} />
    </Suspense>
  );
}
