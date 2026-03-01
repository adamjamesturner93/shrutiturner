import type { Metadata } from "next";
import { ReferralLandingPage } from "@/views/referral-landing";

export const metadata: Metadata = {
  title: "You\'ve Been Invited",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ReferralLandingPage />;
}
