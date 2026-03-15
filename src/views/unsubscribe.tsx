"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Layout } from "../components/layout";
import { SEO } from "../components/seo";
import { Button } from "../components/ui/button";
import { Mail, ArrowLeft, Check, ShieldCheck } from "lucide-react";

export function UnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [status, setStatus] = useState<"idle" | "processing" | "done">(
    token ? "processing" : "idle"
  );
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

  const handleManualUnsubscribe = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setStatus("processing");
    setMessage("");

    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json().catch(() => null)) as {
        email?: string;
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to unsubscribe.");
      }
      setEmail(payload?.email || email);
      setStatus("done");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to unsubscribe.");
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
            <h1 className="text-3xl md:text-4xl">You've been unsubscribed</h1>
            <p className="text-muted-foreground mx-auto max-w-md text-lg">
              {email ? `${email} has` : "You have"} been removed from marketing emails. You will no
              longer receive newsletter or blog update emails.
            </p>
            <p className="text-muted-foreground text-sm">
              Transactional emails about bookings or account access will still be sent when needed.
            </p>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Homepage
              </Link>
            </Button>
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
                  Stop receiving marketing emails. This updates your single email preference for
                  newsletters, updates, and early announcements.
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
                Use the secure link from your email, or enter the email address you want removed.
              </p>

              <form onSubmit={handleManualUnsubscribe} className="space-y-5">
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

                <Button type="submit" className="w-full" disabled={status === "processing"}>
                  {status === "processing" ? "Processing..." : "Unsubscribe"}
                </Button>
              </form>

              {message ? (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {message}
                </div>
              ) : null}

              <p className="text-muted-foreground mt-6 text-sm">
                If you're having trouble, contact{" "}
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
