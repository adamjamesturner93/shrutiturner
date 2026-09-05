import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicPageLoading } from "@/components/public-loading";
import { ReferralLandingPage } from "@/views/referral-landing";

type ReferralPageProps = { params: Promise<{ code: string }> };

export const metadata: Metadata = {
  title: "You\'ve Been Invited",
  robots: { index: false, follow: false },
};

export default function Page({ params }: ReferralPageProps) {
  return (
    <Suspense fallback={<PublicPageLoading label="Loading referral invitation" />}>
      <ReferralContent params={params} />
    </Suspense>
  );
}

async function ReferralContent({ params }: ReferralPageProps) {
  const { code } = await params;
  return <ReferralLandingPage code={code} />;
}
