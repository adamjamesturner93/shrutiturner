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

      <section className="flex min-h-[70vh] items-center py-20 md:py-28">
        <div className="container mx-auto max-w-lg space-y-8 px-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#4B5B32]/10">
            <Gift className="h-10 w-10 text-[#4B5B32]" />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl leading-tight md:text-4xl">
              You've been invited to try a class.
            </h1>
            <p className="text-muted-foreground text-xl leading-relaxed">
              Someone thinks you'd benefit from science-backed strength and yoga coaching for
              complex bodies.
            </p>
          </div>

          <div className="space-y-4 rounded-lg border border-[#4B5B32]/20 bg-[#4B5B32]/5 p-6">
            <p className="text-2xl text-[#4B5B32]">£10 off your first purchase</p>
            <p className="text-muted-foreground">
              Applied automatically when you sign up — whether you choose a membership, class pack,
              or drop-in.
            </p>
            <ul className="text-muted-foreground mx-auto max-w-xs space-y-2 text-left text-sm">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#4B5B32]" />
                <span>Use toward any class — yoga, strength, or HIIT</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#4B5B32]" />
                <span>No commitment, no subscription required</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#4B5B32]" />
                <span>All classes adapted for chronic illness</span>
              </li>
            </ul>
          </div>

          <Link href={`/login?ref=${code}`}>
            <Button size="lg" className="px-8 text-lg">
              Claim Your £10 Off
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>

          <p className="text-muted-foreground text-xs">
            By signing up you agree to our{" "}
            <Link href="/terms" className="underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            . Your referral discount will be applied automatically to your first purchase.
          </p>
        </div>
      </section>
    </Layout>
  );
}
