"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { Gift, ArrowRight, Check } from "lucide-react";

export function ReferralLandingPage() {
  const { code } = useParams<{ code: string }>();

  return (
    <Layout>
      <SEO
        title="You've Been Invited - Shruti Turner"
        description="You've been invited to try a class with Shruti Turner. Get £10 off your first purchase."
        noIndex
      />

      <section className="py-20 md:py-28 min-h-[70vh] flex items-center">
        <div className="container mx-auto px-4 max-w-lg text-center space-y-8">
          <div className="w-20 h-20 bg-[#4B5B32]/10 rounded-full flex items-center justify-center mx-auto">
            <Gift className="w-10 h-10 text-[#4B5B32]" />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl leading-tight">
              You've been invited to try a class.
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Someone thinks you'd benefit from science-backed strength and yoga
              coaching for complex bodies.
            </p>
          </div>

          <div className="bg-[#4B5B32]/5 border border-[#4B5B32]/20 rounded-lg p-6 space-y-4">
            <p className="text-2xl text-[#4B5B32]">£10 off your first purchase</p>
            <p className="text-muted-foreground">
              Applied automatically when you sign up — whether you choose a
              membership, class pack, or drop-in.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-xs mx-auto">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#4B5B32] mt-0.5 flex-shrink-0" />
                <span>Use toward any class — yoga, strength, or HIIT</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#4B5B32] mt-0.5 flex-shrink-0" />
                <span>No commitment, no subscription required</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#4B5B32] mt-0.5 flex-shrink-0" />
                <span>All classes adapted for chronic illness</span>
              </li>
            </ul>
          </div>

          <Link href={`/login?ref=${code}`}>
            <Button size="lg" className="text-lg px-8">
              Claim Your £10 Off
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>

          <p className="text-xs text-muted-foreground">
            By signing up you agree to our{" "}
            <Link href="/terms" className="underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            . Your referral discount will be applied automatically to your first
            purchase.
          </p>
        </div>
      </section>
    </Layout>
  );
}
