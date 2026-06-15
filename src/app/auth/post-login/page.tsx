import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isOwnerAdminRole } from "@/lib/authz/roles";
import { claimReferralCode } from "@/lib/referrals/referral-service";
import { sanitizeRedirectPath } from "@/lib/navigation/safe-redirect";
import { createCreditCheckoutSession } from "@/lib/billing/billing-service";
import {
  buildCreditCheckoutReturnPaths,
  buildPricingFallbackPath,
  firstSearchParam,
} from "@/lib/billing/checkout-flow";

interface PostLoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function resolvePricingCheckout(
  userId: string,
  params: Record<string, string | string[] | undefined>
) {
  const kind = firstSearchParam(params.kind);

  if (kind === "credits") {
    const bundleValue = firstSearchParam(params.bundle);
    const bundle =
      bundleValue === "1" ? 1 : bundleValue === "3" ? 3 : bundleValue === "10" ? 10 : null;
    if (bundle) {
      return createCreditCheckoutSession(
        userId,
        bundle,
        undefined,
        buildCreditCheckoutReturnPaths(bundle)
      );
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
  const redirectParam = sanitizeRedirectPath(firstSearchParam(params.redirect));
  const onboarding = firstSearchParam(params.onboarding) === "1";
  const refCode = firstSearchParam(params.ref);
  const intent = firstSearchParam(params.intent);

  if (refCode) {
    await claimReferralCode(session.user.id, refCode).catch(() => null);
  }

  if (intent === "pricing-checkout") {
    if (firstSearchParam(params.kind) === "membership") {
      const interval = firstSearchParam(params.interval) === "annual" ? "annual" : "monthly";
      redirect(`/dashboard/membership?subscribe=1&interval=${interval}&source=pricing`);
    }
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

  if (isOwnerAdminRole(role)) {
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
