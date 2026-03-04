"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { Mail, ArrowLeft, Check } from "lucide-react";

type UnsubList = "newsletter" | "blog" | "all";

export function UnsubscribePage() {
  const searchParams = useSearchParams();
  const preselectedList = searchParams.get("list") as UnsubList | null;

  const [email, setEmail] = useState("");
  const [unsubList, setUnsubList] = useState<UnsubList>(preselectedList || "all");
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");

  const handleUnsubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("processing");
    console.log("Unsubscribe:", { email, list: unsubList });
    setTimeout(() => {
      setStatus("done");
    }, 1500);
  };

  const listLabel =
    unsubList === "newsletter"
      ? "newsletter"
      : unsubList === "blog"
        ? "blog updates"
        : "all mailing lists";

  return (
    <Layout>
      <SEO
        title="Unsubscribe - Shruti Turner"
        description="Manage your email subscription preferences for Shruti Turner's newsletter and blog."
        canonicalUrl="https://shrutiturner.com/unsubscribe"
      />

      <div className="container mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16">
        {status === "done" ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4B5B32]/10">
              <Check className="h-8 w-8 text-[#4B5B32]" />
            </div>
            <h1 className="text-3xl md:text-4xl">You've Been Unsubscribed</h1>
            <p className="text-muted-foreground mx-auto max-w-md text-lg">
              Your email has been removed from {listLabel}. You won't receive further emails from{" "}
              {unsubList === "all" ? "us" : `the ${listLabel}`}.
            </p>
            {unsubList !== "all" && (
              <div className="bg-secondary/20 text-muted-foreground mx-auto max-w-sm rounded-lg border p-4 text-sm">
                <p>
                  Note: you are still subscribed to{" "}
                  {unsubList === "newsletter" ? "blog updates" : "the newsletter"}. You can{" "}
                  <Link
                    href={`/unsubscribe?list=${unsubList === "newsletter" ? "blog" : "newsletter"}`}
                    className="text-primary underline"
                    onClick={() => {
                      setStatus("idle");
                      setEmail("");
                      setUnsubList(unsubList === "newsletter" ? "blog" : "newsletter");
                    }}
                  >
                    unsubscribe from that too
                  </Link>{" "}
                  if you'd like.
                </p>
              </div>
            )}
            <p className="text-muted-foreground">
              Changed your mind? You can always{" "}
              <Link href="/" className="text-primary underline">
                resubscribe on the homepage
              </Link>
              .
            </p>
            <div className="pt-4">
              <Button asChild variant="outline">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Homepage
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-6 text-center">
            <div className="bg-secondary mx-auto flex h-16 w-16 items-center justify-center rounded-full">
              <Mail className="text-muted-foreground h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl">Unsubscribe</h1>
            <p className="text-muted-foreground mx-auto max-w-md text-lg">
              We're sorry to see you go. Choose which emails you'd like to stop receiving.
            </p>

            <form onSubmit={handleUnsubscribe} className="mx-auto max-w-md space-y-6 pt-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="bg-background text-foreground placeholder:text-muted-foreground w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-[#4B5B32]/40 focus:outline-none"
              />

              {/* List selection */}
              <div className="space-y-3 text-left">
                <p className="text-muted-foreground text-sm">Unsubscribe from:</p>
                <label className="has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors">
                  <input
                    type="radio"
                    name="unsub-list"
                    value="newsletter"
                    checked={unsubList === "newsletter"}
                    onChange={() => setUnsubList("newsletter")}
                    className="mt-1 accent-[#4B5B32]"
                  />
                  <div>
                    <span className="text-sm">Newsletter only</span>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Monthly insights, training tips, and lead magnet emails. You'll still get blog
                      post notifications.
                    </p>
                  </div>
                </label>
                <label className="has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors">
                  <input
                    type="radio"
                    name="unsub-list"
                    value="blog"
                    checked={unsubList === "blog"}
                    onChange={() => setUnsubList("blog")}
                    className="mt-1 accent-[#4B5B32]"
                  />
                  <div>
                    <span className="text-sm">Blog updates only</span>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      New article notifications. You'll still get the monthly newsletter.
                    </p>
                  </div>
                </label>
                <label className="has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors">
                  <input
                    type="radio"
                    name="unsub-list"
                    value="all"
                    checked={unsubList === "all"}
                    onChange={() => setUnsubList("all")}
                    className="mt-1 accent-[#4B5B32]"
                  />
                  <div>
                    <span className="text-sm">All emails</span>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Unsubscribe from everything. You won't receive any further emails.
                    </p>
                  </div>
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={status === "processing"}>
                {status === "processing" ? "Processing..." : "Unsubscribe"}
              </Button>
            </form>

            <p className="text-muted-foreground pt-4 text-sm">
              If you're having trouble, contact us at{" "}
              <a href="mailto:hello@shrutiturner.com" className="text-primary underline">
                hello@shrutiturner.com
              </a>
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
