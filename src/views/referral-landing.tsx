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
        description="You've been invited to try a class with Shruti Turner. Claim your free class gift."
        noIndex
      />

      <section className="flex min-h-[70vh] items-center py-20 md:py-28">
        <div className="container mx-auto max-w-lg space-y-8 px-4 text-center">
          <div className="bg-brand-accent/10 mx-auto flex h-20 w-20 items-center justify-center rounded-full">
            <Gift className="text-brand-accent h-10 w-10" />
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

          <div className="border-brand-accent/20 bg-brand-accent/5 space-y-4 rounded-lg border p-6">
            <p className="text-brand-accent text-2xl">Free class gift</p>
            <p className="text-muted-foreground">
              Sign in through this link and we'll add one free class credit to your account.
            </p>
            <ul className="text-muted-foreground mx-auto max-w-xs space-y-2 text-left text-sm">
              <li className="flex items-start gap-2">
                <Check className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>Use on any live class - yoga, strength, or cardio</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>No commitment required</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-brand-accent mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>If you later make your first purchase, your referrer earns £10</span>
              </li>
            </ul>
          </div>

          <Link href={`/login?ref=${code}`}>
            <Button size="lg" className="px-8 text-lg">
              Claim Your Free Class
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
            . Your free class gift is applied once after sign-in.
          </p>
        </div>
      </section>
    </Layout>
  );
}
