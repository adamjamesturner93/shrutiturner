"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CANONICAL_LEAD_MAGNET } from "@/lib/newsletter/lead-magnet";
import { submitNewsletterSignup } from "@/lib/newsletter-signup";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function HoldingNewsletterForm() {
  const searchParams = useSearchParams();
  const verifiedState = searchParams.get("verified");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const errors = useMemo(() => {
    const nextErrors = {
      consent: "",
      email: "",
      firstName: "",
    };

    if (!showValidation) {
      return nextErrors;
    }

    if (!firstName.trim()) {
      nextErrors.firstName = "Please enter your first name.";
    }

    if (!isValidEmail(email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!consent) {
      nextErrors.consent = "Please confirm that you want to receive email updates.";
    }

    return nextErrors;
  }, [consent, email, firstName, showValidation]);

  const isFormValid =
    firstName.trim().length > 0 && isValidEmail(email) && consent && turnstileToken.length > 0;

  const verificationMessage =
    verifiedState === "success"
      ? {
          body: "Your email is confirmed. Check your inbox for the guide and future launch updates.",
          icon: CheckCircle2,
          tone: "border-emerald-300/40 bg-emerald-500/10 text-emerald-50",
        }
      : verifiedState === "invalid"
        ? {
            body: "That confirmation link is no longer valid. Enter your details again and we’ll send a fresh email.",
            icon: AlertCircle,
            tone: "border-amber-300/40 bg-amber-500/10 text-amber-50",
          }
        : null;

  const statusMessage =
    verificationMessage ||
    (serverMessage
      ? {
          body: serverMessage,
          icon: submitted ? CheckCircle2 : AlertCircle,
          tone: submitted
            ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-50"
            : "border-red-300/40 bg-red-500/10 text-red-50",
        }
      : null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowValidation(true);
    setServerMessage(null);

    if (!isFormValid) {
      return;
    }

    setIsSubmitting(true);

    const result = await submitNewsletterSignup({
      email,
      firstName,
      marketingOptIn: consent,
      consent,
      source: "holding-page",
      turnstileToken,
    });

    setIsSubmitting(false);
    setSubmitted(result.ok);
    setServerMessage(
      result.message ||
        (result.ok
          ? "Please check your inbox to confirm your email address."
          : "Unable to subscribe right now. Please try again.")
    );

    if (result.ok) {
      setEmail("");
      setFirstName("");
      setConsent(false);
      setTurnstileToken("");
      setShowValidation(false);
    }
  }

  return (
    <div className="rounded-[1.45rem] border border-white/15 bg-white/10 p-4 shadow-[0_24px_70px_rgba(8,4,12,0.22)] backdrop-blur-md sm:p-5">
      <div className="text-center">
        <h2 className="font-heading text-[1.65rem] text-white sm:text-[1.8rem]">
          Be the first to know
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/72">
          Join the mailing list for launch updates, useful notes and a free guide:
        </p>
        <p className="text-brand-accent-light mt-2 text-sm italic sm:text-[0.96rem]">
          {CANONICAL_LEAD_MAGNET.title}
        </p>
      </div>

      {statusMessage ? (
        <div
          className={`mt-4 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${statusMessage.tone}`}
          role="status"
          aria-live="polite"
        >
          <statusMessage.icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p className="leading-relaxed">{statusMessage.body}</p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
        <div className="space-y-2">
          <label htmlFor="holding-first-name" className="text-sm text-white/84">
            First name
          </label>
          <Input
            id="holding-first-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="First name"
            aria-describedby={errors.firstName ? "holding-first-name-error" : undefined}
            aria-invalid={errors.firstName ? true : undefined}
            className="h-11 border-white/20 bg-white/12 text-base text-white placeholder:text-white/35"
          />
          {errors.firstName ? (
            <p id="holding-first-name-error" className="text-sm text-red-200">
              {errors.firstName}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="holding-email" className="text-sm text-white/84">
            Email address
          </label>
          <Input
            id="holding-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="your.email@example.com"
            aria-describedby={errors.email ? "holding-email-error" : undefined}
            aria-invalid={errors.email ? true : undefined}
            className="h-11 border-white/20 bg-white/12 text-base text-white placeholder:text-white/35"
          />
          {errors.email ? (
            <p id="holding-email-error" className="text-sm text-red-200">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
          <label htmlFor="holding-consent" className="flex cursor-pointer items-start gap-3">
            <input
              id="holding-consent"
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              aria-describedby={`holding-consent-copy${errors.consent ? " holding-consent-error" : ""}`}
              aria-invalid={errors.consent ? true : undefined}
              className="mt-1 h-4 w-4 rounded border-white/30 accent-[#bb7345]"
            />
            <span
              id="holding-consent-copy"
              className="text-[0.88rem] leading-relaxed text-white/74"
            >
              I&apos;d like to receive the newsletter and occasional updates about new classes,
              coaching, retreats and offers. You can unsubscribe at any time. Read the{" "}
              <a href="/privacy" className="underline decoration-white/40 underline-offset-4">
                privacy policy
              </a>
              .
            </span>
          </label>
          {errors.consent ? (
            <p id="holding-consent-error" className="mt-2 text-sm text-red-200">
              {errors.consent}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/10 p-2.5">
          <TurnstileWidget
            onTokenChange={setTurnstileToken}
            theme="dark"
            className="text-white/72"
          />
        </div>

        <Button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="h-11 w-full bg-[#bb7345] text-white hover:bg-[#c67f52] disabled:opacity-55"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Sending confirmation email...
            </>
          ) : (
            "Subscribe for updates"
          )}
        </Button>
      </form>
    </div>
  );
}
