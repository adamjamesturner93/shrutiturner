"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, Mail, ShieldCheck } from "lucide-react";
import { Layout } from "@/components/layout";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";

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
        const response = await fetch("/api/unsubscribe", {
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
      const response = await fetch("/api/unsubscribe", {
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
        canonicalUrl="https://shrutiturner.com/unsubscribe"
      />

      <div className="container mx-auto flex min-h-[60vh] max-w-5xl flex-col justify-center px-4 py-16">
        {status === "done" ? (
          <div className="mx-auto max-w-2xl space-y-6 text-center">
            <div className="bg-brand-accent/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
              <Check className="text-brand-accent h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl">You&apos;ve been unsubscribed</h1>
            <p className="text-muted-foreground mx-auto max-w-md text-lg">
              {email ? `${email} has` : "You have"} been removed from marketing emails. You will no
              longer receive newsletter or blog update emails.
            </p>
            <div className="bg-secondary/20 text-muted-foreground mx-auto max-w-md rounded-lg border p-4 text-left text-sm">
              Transactional emails about bookings, payments, account access, and important service
              updates will still be sent when needed.
            </div>
            <p className="text-muted-foreground text-sm">
              Changed your mind? You can always{" "}
              <Link href="/subscribe" className="text-primary underline">
                resubscribe
              </Link>
              .
            </p>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Homepage
              </Link>
            </Button>
          </div>
        ) : status === "requested" ? (
          <div className="mx-auto max-w-2xl space-y-6 text-center">
            <div className="bg-brand-accent/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
              <Mail className="text-brand-accent h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl">Check your inbox</h1>
            <p className="text-muted-foreground mx-auto max-w-md text-lg">{message}</p>
            <div className="bg-secondary/20 text-muted-foreground mx-auto max-w-md rounded-lg border p-4 text-left text-sm">
              We only complete the unsubscribe after you use the secure link in that email.
            </div>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Homepage
              </Link>
            </Button>
          </div>
        ) : status === "confirm" ? (
          <div className="mx-auto w-full max-w-md space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-3xl md:text-4xl">Are you sure?</h1>
            <p className="text-muted-foreground text-lg">
              You&apos;re about to request marketing unsubscribe instructions for{" "}
              <strong className="text-foreground">{email}</strong>.
            </p>
            <div className="bg-secondary/30 space-y-3 rounded-lg border p-5 text-left">
              <p className="text-muted-foreground text-sm">You&apos;ll no longer receive:</p>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>Weekly newsletter emails with training tips and insights</li>
                <li>New blog post and article notifications</li>
                <li>Updates about classes, programmes, and offers</li>
              </ul>
            </div>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
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
        ) : (
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="space-y-6">
              <div className="bg-secondary/20 rounded-[1.75rem] border p-8">
                <div className="bg-secondary mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full lg:mx-0">
                  <Mail className="text-muted-foreground h-8 w-8" />
                </div>
                <h1 className="text-3xl md:text-4xl">Unsubscribe</h1>
                <p className="text-muted-foreground mt-4 max-w-md text-base leading-relaxed">
                  Stop receiving marketing emails. For security, we&apos;ll send a confirmation link
                  to the email address you enter.
                </p>
              </div>

              <div className="rounded-[1.75rem] border p-8">
                <div className="mb-4 flex items-center gap-3">
                  <ShieldCheck className="text-brand-accent h-5 w-5" />
                  <h2 className="text-xl">What stays on</h2>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Transactional emails about bookings, payments, account access, or important
                  service updates will still be sent when needed.
                </p>
              </div>
            </div>

            <div className="bg-background rounded-[1.75rem] border p-8 shadow-sm">
              <h2 className="mb-3 text-2xl">Update your marketing email preference</h2>
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                Use the secure link from your email, or enter the address you want removed and
                we&apos;ll send a confirmation link.
              </p>

              <form onSubmit={handleContinue} className="space-y-5">
                <label className="space-y-2 text-sm">
                  <span>Email address</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="bg-background text-foreground placeholder:text-muted-foreground focus:ring-brand-accent/40 w-full rounded-lg border px-4 py-3 focus:ring-2 focus:outline-none"
                  />
                </label>

                <div className="bg-secondary/20 text-muted-foreground rounded-lg border p-4 text-left text-sm">
                  This only affects marketing emails, including newsletters, blog notifications, and
                  launch announcements.
                </div>

                <Button type="submit" className="w-full" disabled={status === "processing"}>
                  {status === "processing" ? "Processing..." : "Continue"}
                </Button>
              </form>

              {message ? (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {message}
                </div>
              ) : null}

              <p className="text-muted-foreground mt-6 text-sm">
                If you&apos;re having trouble, contact{" "}
                <a href="mailto:hello@shrutiturner.com" className="text-primary underline">
                  hello@shrutiturner.com
                </a>
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
