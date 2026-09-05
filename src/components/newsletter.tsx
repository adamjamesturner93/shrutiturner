import { useState } from "react";
import { X, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useNewsletterSignupCopy } from "@/lib/use-newsletter-signup-copy";
import { submitNewsletterSignup } from "@/lib/newsletter-signup";
import { TurnstileWidget } from "@/components/turnstile-widget";

interface NewsletterPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewsletterPopup({ isOpen, onClose }: NewsletterPopupProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [signupState, setSignupState] = useState<"pending" | "subscribed">("pending");
  const [successMessage, setSuccessMessage] = useState("");
  const signupCopy = useNewsletterSignupCopy();

  const closePopup = () => {
    onClose();
    setSubmitted(false);
    setEmail("");
    setFirstName("");
    setConsent(false);
    setTurnstileToken("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await submitNewsletterSignup({
      email,
      firstName,
      marketingOptIn: consent,
      consent,
      source: "popup",
      turnstileToken,
    });
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.message || "Unable to subscribe right now. Please try again.");
      return;
    }

    const nextSignupState = result.state || "pending";
    setSignupState(nextSignupState);
    setSuccessMessage(
      nextSignupState === "subscribed"
        ? result.message ||
            "You’re already confirmed. Keep an eye on your inbox for the next update."
        : "Please check your inbox to confirm your email address."
    );
    setSubmitted(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-background animate-in fade-in zoom-in relative w-full max-w-md rounded-lg border p-8 shadow-lg duration-200">
        <button
          onClick={closePopup}
          className="text-muted-foreground hover:text-foreground absolute top-4 right-4 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {!submitted ? (
          <>
            <div className="mb-6">
              <h3 className="mb-2 text-2xl">
                {signupCopy.popupTitle || "Get Evidence-Based Insights"}
              </h3>
              <p className="text-muted-foreground">{signupCopy.popupDescription}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newsletter-name">First Name</Label>
                <Input
                  id="newsletter-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newsletter-email">Email Address *</Label>
                <Input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={signupCopy.formPlaceholder}
                  required
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting || !turnstileToken || !consent}
              >
                {isSubmitting ? "Subscribing..." : signupCopy.buttonLabel}
              </Button>
              <TurnstileWidget onTokenChange={setTurnstileToken} />

              <label className="bg-secondary/20 flex cursor-pointer items-start gap-3 rounded-lg p-4 text-sm">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="accent-brand-accent mt-0.5 h-4 w-4"
                  required
                />
                <span className="text-muted-foreground">
                  I want newsletter and update emails. I can unsubscribe anytime.
                </span>
              </label>
              <p className="text-muted-foreground text-center text-xs">{signupCopy.consentText}</p>
              {error ? <p className="text-center text-xs text-red-600">{error}</p> : null}
            </form>
          </>
        ) : (
          <div className="py-8 text-center">
            <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Check className="text-primary h-8 w-8" />
            </div>
            <h3 className="mb-2 text-xl">
              {signupState === "subscribed" ? "You’re already subscribed." : "Check your inbox."}
            </h3>
            <p className="text-muted-foreground">{successMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface NewsletterInlineProps {
  buttonLabel?: string;
}

export function NewsletterInline({ buttonLabel }: NewsletterInlineProps = {}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [signupState, setSignupState] = useState<"pending" | "subscribed">("pending");
  const [successMessage, setSuccessMessage] = useState("");
  const signupCopy = useNewsletterSignupCopy();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await submitNewsletterSignup({
      email,
      firstName,
      marketingOptIn: consent,
      consent,
      source: "inline",
      turnstileToken,
    });
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.message || "Unable to subscribe right now. Please try again.");
      return;
    }

    const nextSignupState = result.state || "pending";
    setSignupState(nextSignupState);
    setSuccessMessage(
      nextSignupState === "subscribed"
        ? result.message ||
            "You’re already confirmed. Keep an eye on your inbox for the next update."
        : "Please check your inbox to confirm your email address."
    );
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="py-8 text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <Check className="text-primary h-8 w-8" />
        </div>
        <h3 className="mb-2 text-xl">
          {signupState === "subscribed" ? "You’re already subscribed." : "Check your inbox."}
        </h3>
        <p className="text-muted-foreground">{successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="newsletter-inline-first-name" className="sr-only">
            First name
          </Label>
          <Input
            id="newsletter-inline-first-name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newsletter-inline-email" className="sr-only">
            Email address
          </Label>
          <Input
            id="newsletter-inline-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={signupCopy.formPlaceholder}
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting || !turnstileToken || !consent}
      >
        {isSubmitting ? "Subscribing..." : (buttonLabel ?? signupCopy.buttonLabel)}
      </Button>
      <TurnstileWidget onTokenChange={setTurnstileToken} />

      <label className="bg-secondary/20 flex cursor-pointer items-start gap-3 rounded-lg p-3 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="accent-brand-accent mt-0.5 h-4 w-4"
          required
        />
        <span className="text-muted-foreground">
          I want newsletter and update emails. I can unsubscribe anytime.
        </span>
      </label>
      <p className="text-muted-foreground text-center text-sm">{signupCopy.consentText}</p>
      {error ? <p className="text-center text-xs text-red-600">{error}</p> : null}
    </form>
  );
}
