import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { claimReferralCode } from "@/lib/referrals/referral-service";
import { sanitizeRedirectPath } from "@/lib/navigation/safe-redirect";

interface PostLoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export default async function PostLoginPage({ searchParams }: PostLoginPageProps) {
  const [session, params] = await Promise.all([auth(), searchParams]);

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const redirectParam = sanitizeRedirectPath(first(params.redirect));
  const onboarding = first(params.onboarding) === "1";
  const refCode = first(params.ref);

  if (refCode) {
    await claimReferralCode(session.user.id, refCode).catch(() => null);
  }

  if (redirectParam) {
    redirect(redirectParam);
  }

  if (role === "admin") {
    redirect("/admin");
  }

  redirect(onboarding ? "/dashboard?onboarding=true" : "/dashboard");
}
