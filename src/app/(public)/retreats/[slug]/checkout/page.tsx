import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RetreatCheckoutPage } from "@/views/retreat-checkout";
import { getOperationalRetreatBySlug } from "@/lib/retreats/service";
import { RetreatCheckoutPageLoading } from "@/components/public-loading";
import { auth } from "@/lib/auth";
import { getAcceptanceRequirementStates } from "@/lib/legal/acceptance-service";
import { getCurrentPolicyVersion } from "@/lib/legal/policy-service";
import { AcceptanceType } from "@prisma/client";

export const metadata: Metadata = {
  title: "Retreat checkout",
  robots: { index: false, follow: false },
};

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<RetreatCheckoutPageLoading />}>
      <RetreatCheckoutContent params={params} />
    </Suspense>
  );
}

async function RetreatCheckoutContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const retreat = await getOperationalRetreatBySlug(slug);
  if (!retreat) notFound();
  const session = await auth();
  const termsRequirement = session?.user?.id
    ? (
        await getAcceptanceRequirementStates(session.user.id, [
          { type: AcceptanceType.terms, surface: "retreat_checkout" },
        ])
      )[0]
    : null;
  const termsVersion =
    termsRequirement?.currentVersion ||
    (await getCurrentPolicyVersion(AcceptanceType.terms)).version;
  return (
    <RetreatCheckoutPage
      retreat={retreat}
      initialTermsRequirement={termsRequirement}
      termsVersion={termsVersion}
    />
  );
}
