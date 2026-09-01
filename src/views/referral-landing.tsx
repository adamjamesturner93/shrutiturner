"use client";

import Link from "next/link";
import { ArrowRight, Gift } from "lucide-react";
import { Layout } from "@/components/layout";
import { EditorialHero, PreFooterCtaSection, ProofBand } from "@/components/marketing/sections";
import { SEO } from "@/components/seo";

const referralProof = [
  {
    label: "Gift",
    detail: "One free class credit is added after sign-in through this referral link.",
  },
  {
    label: "Use It On",
    detail: "Any live yoga, strength, or cardio class in the Move Well schedule.",
  },
  {
    label: "Pressure",
    detail: "No subscription is required to redeem the class credit.",
  },
  {
    label: "Referral",
    detail: "If you later make your first purchase, your referrer earns £10.",
  },
] as const;

export function ReferralLandingPage({ code }: { code: string }) {
  return (
    <Layout>
      <SEO
        title="You've Been Invited - Shruti Turner"
        description="You've been invited to try a class with Shruti Turner. Claim your free class gift."
        noIndex
      />

      <EditorialHero
        eyebrow="Referral Invite"
        size="compact"
        title={
          <>
            Someone thinks you would benefit from
            <span className="text-brand-accent-light"> a class that actually fits.</span>
          </>
        }
        description="Use this invite to sign in and claim a free class credit. It is a straightforward way to try the studio without committing to anything else."
        primaryCta={{ href: `/login?ref=${code}`, label: "Claim Your Free Class" }}
        secondaryCta={{ href: "/classes", label: "Explore Classes First" }}
        metrics={[
          {
            label: "Includes",
            detail: "One free class credit after sign-in.",
          },
          {
            label: "Applies To",
            detail: "Live yoga, strengthand cardio classes.",
          },
          {
            label: "Commitment",
            detail: "None required to redeem the gift.",
          },
        ]}
        aside={
          <div className="border-brand-white/10 bg-brand-white/8 mx-auto max-w-xl overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
            <div className="bg-brand-white/8 rounded-[1.45rem] p-6">
              <div className="bg-brand-accent-light/12 text-brand-accent-light flex h-12 w-12 items-center justify-center rounded-2xl">
                <Gift className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-3xl">Free class gift</h2>
              <div className="mt-5 space-y-3">
                {[
                  "Use on any live class: yoga, strength, or cardio.",
                  "No commitment required after you redeem it.",
                  "Your referrer earns £10 only if you later make your first purchase.",
                ].map((item) => (
                  <div
                    key={item}
                    className="border-brand-white/10 bg-brand-white/8 text-brand-white/84 rounded-[1.2rem] border px-4 py-4 text-sm leading-relaxed"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      />

      <ProofBand
        title="How the referral works"
        description="The referral is intentionally simple so you can try the studio without negotiating a complicated offer."
        items={[...referralProof]}
      />

      <PreFooterCtaSection
        layout="centered"
        title="Ready to claim the class?"
        description="Sign in through this link and the free class credit will be added to your account."
        actions={[
          {
            href: `/login?ref=${code}`,
            label: "Claim Your Free Class",
            icon: ArrowRight,
          },
          {
            href: "/classes",
            label: "View the Class Types",
            variant: "secondary",
          },
        ]}
      >
        <p className="text-brand-white/70 text-xs">
          By signing up you agree to the{" "}
          <Link href="/terms" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </PreFooterCtaSection>
    </Layout>
  );
}
