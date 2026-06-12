"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, Mail, ShieldCheck } from "lucide-react";
import { Layout } from "@/components/layout";
import { SectionHeading } from "@/components/marketing/sections";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UnsubscribeStatus = "idle" | "confirm" | "processing" | "requested" | "done";

export function UnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [status, setStatus] = useState<UnsubscribeStatus>(token ? "processing" : "idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/newsletter/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const payload = (await response.json().catch(() => null)) as {
          email?: string;
          message?: string;
        } | null;
        if (!response.ok) {
          throw new Error(payload?.message || "Failed to unsubscribe.");
        }
        if (!active) return;
        setEmail(payload?.email || emailParam);
        setStatus("done");
      } catch (error) {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "Failed to unsubscribe.");
        setStatus("idle");
      }
    })();

    return () => {
      active = false;
    };
  }, [token, emailParam]);

  const handleContinue = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setMessage("");
    setStatus("confirm");
  };

  const handleConfirmUnsubscribe = async () => {
    setStatus("processing");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to start unsubscribe.");
      }
      setMessage(
        payload?.message || "If that email is subscribed, we have sent a secure unsubscribe link."
      );
      setStatus("requested");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to start unsubscribe.");
      setStatus("idle");
    }
  };

  return (
    <Layout>
      <SEO
        title="Unsubscribe - Shruti Turner"
        description="Manage your email preferences for Shruti Turner marketing emails."
        canonicalUrl="https://shrutiturner.co.uk/unsubscribe"
      />

      <div className="section-wash min-h-[calc(100dvh-4rem)] px-4 py-8 md:py-10">
        <div className="container mx-auto max-w-5xl">
          {status === "done" ? (
            <div className="marketing-panel mx-auto flex min-h-[calc(100dvh-14rem)] max-w-2xl items-center rounded-[2rem] px-6 py-10 text-center md:px-10">
              <div className="w-full">
                <div className="bg-brand-accent/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                  <Check className="text-brand-accent h-8 w-8" />
                </div>
                <h1 className="mt-6 text-3xl md:text-4xl">You&apos;ve been unsubscribed</h1>
                <p className="text-muted-foreground mx-auto mt-4 max-w-md text-lg">
                  {email ? `${email} has` : "You have"} been removed from marketing emails. You will
                  no longer receive launch updates, newsletters, or promotional emails.
                </p>
                <div className="bg-secondary/20 text-muted-foreground mx-auto mt-6 max-w-md rounded-[1.4rem] border p-4 text-left text-sm">
                  Transactional emails about bookings, payments, account access and important
                  service updates will still be sent when needed.
                </div>
                <p className="text-muted-foreground mt-5 text-sm">
                  Changed your mind? You can always{" "}
                  <Link href="/" className="text-primary underline">
                    subscribe again
                  </Link>
                  .
                </p>
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Homepage
                  </Link>
                </Button>
              </div>
            </div>
          ) : status === "requested" ? (
            <div className="marketing-panel mx-auto flex min-h-[calc(100dvh-14rem)] max-w-2xl items-center rounded-[2rem] px-6 py-10 text-center md:px-10">
              <div className="w-full">
                <div className="bg-brand-accent/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                  <Mail className="text-brand-accent h-8 w-8" />
                </div>
                <h1 className="mt-6 text-3xl md:text-4xl">Check your inbox</h1>
                <p className="text-muted-foreground mx-auto mt-4 max-w-md text-lg">{message}</p>
                <div className="bg-secondary/20 text-muted-foreground mx-auto mt-6 max-w-md rounded-[1.4rem] border p-4 text-left text-sm">
                  We only complete the unsubscribe after you use the secure link in that email.
                </div>
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Homepage
                  </Link>
                </Button>
              </div>
            </div>
          ) : status === "confirm" ? (
            <div className="marketing-panel mx-auto flex min-h-[calc(100dvh-14rem)] w-full max-w-xl items-center rounded-[2rem] px-6 py-10 text-center md:px-8">
              <div className="w-full">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                  <AlertTriangle className="h-8 w-8 text-amber-600" />
                </div>
                <h1 className="mt-6 text-3xl md:text-4xl">Are you sure?</h1>
                <p className="text-muted-foreground mt-4 text-lg">
                  You&apos;re about to request marketing unsubscribe instructions for{" "}
                  <strong className="text-foreground">{email}</strong>.
                </p>
                <div className="bg-secondary/30 mt-6 space-y-3 rounded-[1.4rem] border p-5 text-left">
                  <p className="text-muted-foreground text-sm">You&apos;ll no longer receive:</p>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li>Launch announcements and newsletter emails</li>
                    <li>Updates about classes, programmes, retreats and offers</li>
                    <li>Occasional practical training notes from Shruti</li>
                  </ul>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button variant="outline" className="flex-1" onClick={() => setStatus("idle")}>
                    Keep Me Subscribed
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => void handleConfirmUnsubscribe()}
                  >
                    Email Me the Link
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:min-h-[calc(100dvh-12rem)] lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="marketing-grid text-brand-white overflow-hidden rounded-[2rem] px-6 py-7 md:px-8 md:py-8">
                <div className="relative z-10">
                  <p className="text-brand-accent-light text-xs tracking-[0.3em] uppercase">
                    Email Preferences
                  </p>
                  <h1 className="mt-5 text-4xl leading-tight md:text-5xl">Unsubscribe</h1>
                  <p className="text-brand-white/78 mt-5 max-w-md text-lg leading-relaxed">
                    Stop receiving marketing emails. For security, we&apos;ll send a confirmation
                    link to the email address you enter.
                  </p>

                  <div className="border-brand-white/10 bg-brand-white/8 mt-8 rounded-[1.5rem] border p-6">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="text-brand-accent-light h-5 w-5" />
                      <h2 className="text-lg">What stays on</h2>
                    </div>
                    <p className="text-brand-white/74 mt-3 text-sm leading-relaxed">
                      Transactional emails about bookings, payments, account access, or important
                      service updates will still be sent when needed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="marketing-panel rounded-[2rem] px-6 py-7 md:px-8 md:py-8">
                <SectionHeading
                  eyebrow="Secure Request"
                  title="Update your marketing email preference"
                  description="Use the secure link from your email, or enter the address you want removed and we'll send a confirmation link."
                />

                <form onSubmit={handleContinue} className="mt-8 space-y-5">
                  <label className="space-y-2 text-sm">
                    <span>Email address</span>
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="h-12"
                    />
                  </label>

                  <div className="bg-secondary/20 text-muted-foreground rounded-[1.3rem] border p-4 text-left text-sm">
                    This only affects marketing emails, including newsletters, launch updates and
                    occasional offers.
                  </div>

                  <Button type="submit" className="w-full" disabled={status === "processing"}>
                    {status === "processing" ? "Processing..." : "Continue"}
                  </Button>

                  {message ? (
                    <div className="rounded-[1.3rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {message}
                    </div>
                  ) : null}
                </form>

                <p className="text-muted-foreground mt-6 text-sm leading-relaxed">
                  Use the secure link from your email, or enter the address you want removed and
                  we&apos;ll send a confirmation link. If you&apos;re having trouble, contact{" "}
                  <a
                    href="mailto:tech@thechronicyogini.com"
                    className="text-primary font-medium underline decoration-2 underline-offset-3"
                  >
                    tech@thechronicyogini.com
                  </a>
                  .
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
