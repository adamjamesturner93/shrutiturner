import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isOwnerAdminRole } from "@/lib/authz/roles";
import { claimReferralCode } from "@/lib/referrals/referral-service";
import { sanitizeRedirectPath } from "@/lib/navigation/safe-redirect";
import { firstSearchParam } from "@/lib/billing/checkout-flow";

interface PostLoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
    redirect("/dashboard/coaching");
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
