"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Gift, User } from "lucide-react";
import { Layout } from "@/components/layout";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import type { PublicProgrammeCheckoutState } from "@/lib/small-groups/service";
import { buildSmallGroupTemplateCheckoutHref } from "@/lib/small-groups/routes";

export function ProgrammeCheckoutPage({
  templateSlug,
  initialState,
}: {
  templateSlug: string;
  initialState: PublicProgrammeCheckoutState;
}) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const checkoutState = searchParams.get("checkout");
  const isGiftDefault = searchParams.get("gift") === "1";
  const requestedRunSlug = searchParams.get("run");
  const template = initialState.template;
  const initialRun =
    (requestedRunSlug ? template?.runs.find((run) => run.runSlug === requestedRunSlug) : null) ||
    initialState.run;

  const [selectedRunSlug, setSelectedRunSlug] = useState(initialRun?.runSlug || "");
  const [purchaseMode, setPurchaseMode] = useState<"self" | "gift">(
    isGiftDefault ? "gift" : "self"
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    purchaserFirstName: user?.firstName || "",
    purchaserLastName: user?.lastName || "",
    purchaserEmail: user?.email || "",
    attendeeFirstName: user?.firstName || "",
    attendeeLastName: user?.lastName || "",
    attendeeEmail: user?.email || "",
    recipientFirstName: "",
    recipientLastName: "",
    recipientEmail: "",
    recipientMessage: "",
    deliveryTarget: "recipient" as "recipient" | "buyer",
  });

  useEffect(() => {
    if (initialRun?.runSlug && !selectedRunSlug) {
      setSelectedRunSlug(initialRun.runSlug);
    }
  }, [initialRun?.runSlug, selectedRunSlug]);

  const selectedRun =
    template?.runs.find((run) => run.runSlug === selectedRunSlug) || initialRun || null;

  const activeHref = useMemo(() => {
    if (!selectedRun) return buildSmallGroupTemplateCheckoutHref(templateSlug, "pending");
    return buildSmallGroupTemplateCheckoutHref(templateSlug, selectedRun.runSlug, {
      gift: purchaseMode === "gift",
    });
  }, [purchaseMode, selectedRun, templateSlug]);

  if (!template || !selectedRun) {
    return (
      <Layout>
        <SEO title="Programme Checkout" noIndex />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl">Programme unavailable</h1>
          <p className="text-muted-foreground mt-4">
            This programme is not available for checkout right now.
          </p>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/classes/small-group/${templateSlug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseMode,
          runSlug: selectedRun.runSlug,
          ...formData,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        checkoutUrl?: string;
        message?: string;
      } | null;
      if (!response.ok || !payload?.checkoutUrl) {
        throw new Error(payload?.message || "Failed to start checkout.");
      }
      window.location.href = payload.checkoutUrl;
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to start checkout.");
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <SEO
        title={`Checkout ${template.title} - Shruti Turner`}
        description={`Reserve your place on ${template.title}.`}
        noIndex
      />

      <section className="bg-brand-dark py-16 text-white">
        <div className="container mx-auto max-w-5xl px-4">
          <Link
            href={`/classes/small-group/${templateSlug}`}
            className="text-brand-accent-light inline-flex items-center gap-2 text-sm hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to programme details
          </Link>
          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl md:text-5xl">
                {purchaseMode === "gift" ? "Gift this programme" : "Join this programme"}
              </h1>
              <p className="text-brand-accent-light mt-3 max-w-2xl text-lg">{template.title}</p>
              <p className="text-brand-accent-light mt-2 text-sm">
                {selectedRun.scheduleLabel || "Schedule announced soon"}
              </p>
            </div>
            <div className="rounded-full border border-white/20 px-4 py-2 text-sm">
              {selectedRun.priceLabel}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            {checkoutState === "success" ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                Payment received. You can close this page or continue below if you need another
                booking.
              </div>
            ) : null}
            {checkoutState === "cancelled" ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Checkout was cancelled. Your details are still here if you want to try again.
              </div>
            ) : null}
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="rounded-[1.5rem] border p-6">
              <h2 className="text-2xl">Choose your run</h2>
              <div className="mt-4 space-y-3">
                {template.runs.map((run) => (
                  <label
                    key={run.runSlug}
                    className={`flex cursor-pointer items-start justify-between gap-4 rounded-xl border p-4 ${
                      run.runSlug === selectedRunSlug ? "border-brand-accent bg-secondary/20" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm">
                        {run.startDate
                          ? new Date(run.startDate).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "Dates announced soon"}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {run.scheduleLabel || "Schedule announced soon"}
                      </p>
                      {run.badge ? (
                        <p className="mt-2 text-xs text-orange-700">{run.badge}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{run.priceLabel}</span>
                      <input
                        type="radio"
                        name="selectedRun"
                        value={run.runSlug}
                        checked={selectedRunSlug === run.runSlug}
                        onChange={() => setSelectedRunSlug(run.runSlug)}
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border p-6">
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant={purchaseMode === "self" ? "default" : "outline"}
                  onClick={() => setPurchaseMode("self")}
                >
                  For me
                </Button>
                <Button
                  type="button"
                  variant={purchaseMode === "gift" ? "default" : "outline"}
                  onClick={() => setPurchaseMode("gift")}
                >
                  Buy as a gift
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-[1.5rem] border p-6">
                <h2 className="text-2xl">Purchaser details</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="purchaserFirstName">First name</Label>
                    <Input
                      id="purchaserFirstName"
                      required
                      value={formData.purchaserFirstName}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          purchaserFirstName: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchaserLastName">Last name</Label>
                    <Input
                      id="purchaserLastName"
                      required
                      value={formData.purchaserLastName}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          purchaserLastName: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="purchaserEmail">Email</Label>
                  <Input
                    id="purchaserEmail"
                    required
                    type="email"
                    value={formData.purchaserEmail}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        purchaserEmail: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {purchaseMode === "self" ? (
                <div className="rounded-[1.5rem] border p-6">
                  <h2 className="flex items-center gap-2 text-2xl">
                    <User className="text-brand-accent h-5 w-5" />
                    Attendee details
                  </h2>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="attendeeFirstName">First name</Label>
                      <Input
                        id="attendeeFirstName"
                        required
                        value={formData.attendeeFirstName}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            attendeeFirstName: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="attendeeLastName">Last name</Label>
                      <Input
                        id="attendeeLastName"
                        required
                        value={formData.attendeeLastName}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            attendeeLastName: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="attendeeEmail">Email</Label>
                    <Input
                      id="attendeeEmail"
                      required
                      type="email"
                      value={formData.attendeeEmail}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          attendeeEmail: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-[1.5rem] border p-6">
                  <h2 className="flex items-center gap-2 text-2xl">
                    <Gift className="text-brand-accent h-5 w-5" />
                    Gift recipient
                  </h2>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="recipientFirstName">First name</Label>
                      <Input
                        id="recipientFirstName"
                        required
                        value={formData.recipientFirstName}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            recipientFirstName: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipientLastName">Last name</Label>
                      <Input
                        id="recipientLastName"
                        required
                        value={formData.recipientLastName}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            recipientLastName: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="recipientEmail">Email</Label>
                    <Input
                      id="recipientEmail"
                      required
                      type="email"
                      value={formData.recipientEmail}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          recipientEmail: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="recipientMessage">Message</Label>
                    <Textarea
                      id="recipientMessage"
                      rows={5}
                      value={formData.recipientMessage}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          recipientMessage: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={
                  submitting ||
                  (purchaseMode === "gift" ? !selectedRun.canGift : !selectedRun.canCheckout)
                }
                className="w-full"
              >
                {submitting
                  ? "Starting checkout..."
                  : purchaseMode === "gift" && !selectedRun.canGift
                    ? "Gifting not available for this run"
                    : purchaseMode === "self" && !selectedRun.canCheckout
                      ? "This run is not open for checkout"
                      : purchaseMode === "gift"
                        ? "Continue to gift checkout"
                        : "Continue to checkout"}
              </Button>
            </form>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[1.5rem] border p-6">
              <h2 className="text-xl">Summary</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Programme</span>
                  <span className="text-right">{template.title}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Run</span>
                  <span className="text-right">
                    {selectedRun.startDate
                      ? new Date(selectedRun.startDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "TBC"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Schedule</span>
                  <span className="text-right">{selectedRun.scheduleLabel || "TBC"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Price</span>
                  <span className="text-right">{selectedRun.priceLabel}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border p-6 text-sm leading-relaxed">
              <p className="text-muted-foreground">
                Places are reserved at checkout against this scheduled run. If you are buying as a
                gift, the recipient will redeem the reserved place later from their gift link.
              </p>
              <Link href={activeHref} className="mt-4 inline-block text-sm underline">
                Copy this checkout state link
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
