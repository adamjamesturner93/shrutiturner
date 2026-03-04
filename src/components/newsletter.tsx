import { useState } from "react";
import { X, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useNewsletterSignupCopy } from "@/lib/use-newsletter-signup-copy";
import { submitNewsletterSignup } from "@/lib/newsletter-signup";

/* ──────────── Types ──────────── */

export type SubscriptionType = "newsletter" | "blog" | "both";

/* ──────────── Popup (scroll / timer triggered) ──────────── */

interface NewsletterPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewsletterPopup({ isOpen, onClose }: NewsletterPopupProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [subscribeBlog, setSubscribeBlog] = useState(false);
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const signupCopy = useNewsletterSignupCopy();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lists: string[] = [];
    if (subscribeNewsletter) lists.push("newsletter");
    if (subscribeBlog) lists.push("blog");
    setError(null);
    setIsSubmitting(true);
    const result = await submitNewsletterSignup({
      email,
      firstName,
      lists: lists as Array<"newsletter" | "blog">,
      consent,
      source: "popup",
    });
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.message || "Unable to subscribe right now. Please try again.");
      return;
    }

    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setEmail("");
      setFirstName("");
      setConsent(false);
      setSubscribeNewsletter(false);
      setSubscribeBlog(false);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-background animate-in fade-in zoom-in relative w-full max-w-md rounded-lg border p-8 shadow-lg duration-200">
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground absolute top-4 right-4 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {!submitted ? (
          <>
            <div className="mb-6">
              <h3 className="mb-2 text-2xl">{signupCopy.popupTitle || "Get Evidence-Based Insights"}</h3>
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

              {/* Subscription preferences */}
              <div className="bg-secondary/20 space-y-3 rounded-lg p-4">
                <p className="text-muted-foreground text-sm">I&apos;d like to receive:</p>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={subscribeNewsletter}
                    onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                    className="h-4 w-4 accent-[#4B5B32]"
                  />
                  <div>
                    <span className="text-sm">Newsletter</span>
                    <p className="text-muted-foreground text-xs">
                      Monthly insights, training tips, and the lead magnet
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={subscribeBlog}
                    onChange={(e) => setSubscribeBlog(e.target.checked)}
                    className="h-4 w-4 accent-[#4B5B32]"
                  />
                  <div>
                    <span className="text-sm">Blog updates</span>
                    <p className="text-muted-foreground text-xs">
                      New article notifications (1-2 per month)
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting || (!subscribeNewsletter && !subscribeBlog)}
              >
                {isSubmitting ? "Subscribing..." : signupCopy.buttonLabel}
              </Button>

              <label className="flex cursor-pointer items-start gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#4B5B32]"
                  required
                />
                <span className="text-muted-foreground">
                  I consent to receiving marketing emails and understand I can unsubscribe anytime.
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
            <h3 className="mb-2 text-xl">You&apos;re subscribed!</h3>
            <p className="text-muted-foreground">{signupCopy.successMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────── Inline (used on blog page) ──────────── */

interface NewsletterInlineProps {
  /** Which list to subscribe to. Defaults to "both". */
  defaultList?: SubscriptionType;
  /** Show checkboxes for choosing lists */
  showListOptions?: boolean;
}

export function NewsletterInline({
  defaultList = "both",
  showListOptions = false,
}: NewsletterInlineProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(
    defaultList === "newsletter" || defaultList === "both"
  );
  const [subscribeBlog, setSubscribeBlog] = useState(
    defaultList === "blog" || defaultList === "both"
  );
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const signupCopy = useNewsletterSignupCopy();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lists: string[] = [];
    if (subscribeNewsletter) lists.push("newsletter");
    if (subscribeBlog) lists.push("blog");
    setError(null);
    setIsSubmitting(true);
    const result = await submitNewsletterSignup({
      email,
      firstName,
      lists: lists as Array<"newsletter" | "blog">,
      consent,
      source: "inline",
    });
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.message || "Unable to subscribe right now. Please try again.");
      return;
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail("");
      setFirstName("");
      setConsent(false);
    }, 3000);
  };

  if (submitted) {
    return (
      <div className="py-8 text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <Check className="text-primary h-8 w-8" />
        </div>
        <h3 className="mb-2 text-xl">You&apos;re subscribed!</h3>
        <p className="text-muted-foreground">Check your inbox for a confirmation email.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
        />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={signupCopy.formPlaceholder}
          required
        />
      </div>

      {showListOptions && (
        <div className="flex flex-wrap justify-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={subscribeNewsletter}
              onChange={(e) => setSubscribeNewsletter(e.target.checked)}
              className="h-4 w-4 accent-[#4B5B32]"
            />
            Newsletter
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={subscribeBlog}
              onChange={(e) => setSubscribeBlog(e.target.checked)}
              className="h-4 w-4 accent-[#4B5B32]"
            />
            Blog updates
          </label>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting || (!subscribeNewsletter && !subscribeBlog)}
      >
        {isSubmitting
          ? "Subscribing..."
          : defaultList === "blog"
          ? "Subscribe to Blog Updates"
          : defaultList === "newsletter"
            ? "Subscribe to Newsletter"
            : "Subscribe"}
      </Button>
      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#4B5B32]"
          required
        />
        <span className="text-muted-foreground">
          I consent to receiving marketing emails and can unsubscribe anytime.
        </span>
      </label>
      <p className="text-muted-foreground text-center text-sm">
        {signupCopy.consentText}
      </p>
      {error ? <p className="text-center text-xs text-red-600">{error}</p> : null}
    </form>
  );
}
