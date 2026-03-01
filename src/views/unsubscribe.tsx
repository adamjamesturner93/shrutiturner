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
  const [unsubList, setUnsubList] = useState<UnsubList>(
    preselectedList || "all"
  );
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

      <div className="container mx-auto px-4 py-16 max-w-2xl min-h-[60vh] flex flex-col items-center justify-center">
        {status === "done" ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#4B5B32]/10 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-[#4B5B32]" />
            </div>
            <h1 className="text-3xl md:text-4xl">You've Been Unsubscribed</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Your email has been removed from {listLabel}. You won't receive
              further emails from{" "}
              {unsubList === "all" ? "us" : `the ${listLabel}`}.
            </p>
            {unsubList !== "all" && (
              <div className="bg-secondary/20 border rounded-lg p-4 max-w-sm mx-auto text-sm text-muted-foreground">
                <p>
                  Note: you are still subscribed to{" "}
                  {unsubList === "newsletter" ? "blog updates" : "the newsletter"}
                  . You can{" "}
                  <Link href={`/unsubscribe?list=${
                      unsubList === "newsletter" ? "blog" : "newsletter"
                    }`}
                    className="text-primary underline"
                    onClick={() => {
                      setStatus("idle");
                      setEmail("");
                      setUnsubList(
                        unsubList === "newsletter" ? "blog" : "newsletter"
                      );
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
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Homepage
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6 w-full">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl">Unsubscribe</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              We're sorry to see you go. Choose which emails you'd like to stop
              receiving.
            </p>

            <form
              onSubmit={handleUnsubscribe}
              className="max-w-md mx-auto space-y-6 pt-4"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full px-4 py-3 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#4B5B32]/40"
              />

              {/* List selection */}
              <div className="space-y-3 text-left">
                <p className="text-sm text-muted-foreground">
                  Unsubscribe from:
                </p>
                <label className="flex items-start gap-3 cursor-pointer border rounded-lg p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input
                    type="radio"
                    name="unsub-list"
                    value="newsletter"
                    checked={unsubList === "newsletter"}
                    onChange={() => setUnsubList("newsletter")}
                    className="accent-[#4B5B32] mt-1"
                  />
                  <div>
                    <span className="text-sm">Newsletter only</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Monthly insights, training tips, and lead magnet emails.
                      You'll still get blog post notifications.
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer border rounded-lg p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input
                    type="radio"
                    name="unsub-list"
                    value="blog"
                    checked={unsubList === "blog"}
                    onChange={() => setUnsubList("blog")}
                    className="accent-[#4B5B32] mt-1"
                  />
                  <div>
                    <span className="text-sm">Blog updates only</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      New article notifications. You'll still get the monthly
                      newsletter.
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer border rounded-lg p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input
                    type="radio"
                    name="unsub-list"
                    value="all"
                    checked={unsubList === "all"}
                    onChange={() => setUnsubList("all")}
                    className="accent-[#4B5B32] mt-1"
                  />
                  <div>
                    <span className="text-sm">All emails</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Unsubscribe from everything. You won't receive any further
                      emails.
                    </p>
                  </div>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={status === "processing"}
              >
                {status === "processing" ? "Processing..." : "Unsubscribe"}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground pt-4">
              If you're having trouble, contact us at{" "}
              <a
                href="mailto:hello@shrutiturner.com"
                className="text-primary underline"
              >
                hello@shrutiturner.com
              </a>
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
