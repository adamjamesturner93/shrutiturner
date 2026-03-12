import Link from "next/link";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Instagram, Facebook } from "lucide-react";
import { useNewsletterSignupCopy } from "@/lib/use-newsletter-signup-copy";
import { submitNewsletterSignup } from "@/lib/newsletter-signup";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { IconHorizontal } from "./icon";

export function Footer() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const signupCopy = useNewsletterSignupCopy();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setIsSubmitting(true);
    const result = await submitNewsletterSignup({
      email,
      marketingOptIn: consent,
      consent,
      source: "footer",
      turnstileToken,
    });
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.message || "Unable to subscribe right now. Please try again.");
      return;
    }

    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setEmail("");
      setConsent(false);
      setTurnstileToken("");
    }, 3000);
  };

  return (
    <footer className="mt-24 border-t bg-[#2E1F33] text-[#FAFAF8]">
      <div className="container mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand + Newsletter */}
          <div className="space-y-6 lg:col-span-2">
            <div
              className="[&>svg]:h-12 [&>svg]:w-auto [&_path]:fill-[#FAFAF8] [&_line]:stroke-[#FAFAF8]"
              role="img"
              aria-label="Shruti Turner"
            >
              <IconHorizontal />
            </div>
            <p className="max-w-md leading-relaxed text-[#FAFAF8]/70">
              Science-backed strength and yoga coaching for people with chronic illness, autoimmune
              conditions, and complex bodies. PhD Biomechanics. Living with psoriatic arthritis.
            </p>

            {/* Newsletter in footer */}
            <div className="rounded-lg border border-[#FAFAF8]/15 bg-[#FAFAF8]/5 p-4">
              <h4 className="text-sm uppercase tracking-wide text-[#B5C49B]">Newsletter</h4>
              <p className="mt-2 mb-3 text-sm text-[#FAFAF8]/75">{signupCopy.hookText}</p>
              {!subscribed ? (
                <form onSubmit={handleNewsletterSubmit} className="flex max-w-sm flex-col gap-2 sm:flex-row">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={signupCopy.formPlaceholder}
                    required
                    className="border-[#FAFAF8]/20 bg-[#FAFAF8]/10 text-[#FAFAF8] placeholder:text-[#FAFAF8]/40"
                  />
                  <Button
                    type="submit"
                    className="flex-shrink-0 bg-[#B5C49B] text-[#2E1F33] hover:bg-[#a5b48b]"
                    disabled={isSubmitting || !consent || !turnstileToken}
                  >
                    {isSubmitting ? "Subscribing..." : signupCopy.buttonLabel}
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-[#B5C49B]">{signupCopy.successMessage}</p>
              )}
              {!subscribed ? <div className="mt-3"><TurnstileWidget onTokenChange={setTurnstileToken} /></div> : null}
              <label className="mt-2 flex cursor-pointer items-start gap-2 text-xs text-[#FAFAF8]/60">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 accent-[#B5C49B]"
                  required
                />
                <span>
                  I want newsletter and update emails. I can unsubscribe anytime.
                </span>
              </label>
              <p className="mt-1 text-xs text-[#FAFAF8]/40">{signupCopy.consentText}</p>
              {error ? <p className="mt-1 text-xs text-red-300">{error}</p> : null}
            </div>

            {/* Social Media */}
            <div className="flex items-center gap-4 pt-2">
              <a
                href="https://instagram.com/shrutiturner"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FAFAF8]/60 transition-colors hover:text-[#B5C49B]"
                aria-label="Follow on Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com/shrutiturner"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FAFAF8]/60 transition-colors hover:text-[#B5C49B]"
                aria-label="Follow on Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="mb-4 text-[#B5C49B]">Services</h4>
            <ul className="space-y-2 text-[#FAFAF8]/70">
              <li>
                <Link href="/classes/yoga" className="transition-colors hover:text-[#B5C49B]">
                  Yoga Classes
                </Link>
              </li>
              <li>
                <Link href="/classes/strength" className="transition-colors hover:text-[#B5C49B]">
                  Strength Classes
                </Link>
              </li>
              <li>
                <Link
                  href="/classes/small-groups"
                  className="transition-colors hover:text-[#B5C49B]"
                >
                  Small Group Programs
                </Link>
              </li>
              <li>
                <Link href="/pt" className="transition-colors hover:text-[#B5C49B]">
                  1:1 Training
                </Link>
              </li>
              <li>
                <Link href="/retreats" className="transition-colors hover:text-[#B5C49B]">
                  Retreats
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="transition-colors hover:text-[#B5C49B]">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="transition-colors hover:text-[#B5C49B]">
                  Schedule
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 text-[#B5C49B]">Company</h4>
            <ul className="space-y-2 text-[#FAFAF8]/70">
              <li>
                <Link href="/about" className="transition-colors hover:text-[#B5C49B]">
                  About Shruti
                </Link>
              </li>
              <li>
                <Link href="/blog" className="transition-colors hover:text-[#B5C49B]">
                  Blog & Resources
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-[#B5C49B]">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/login" className="transition-colors hover:text-[#B5C49B]">
                  Client Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-[#FAFAF8]/10 pt-8 text-center text-sm text-[#FAFAF8]/50">
          <div className="mb-4 flex flex-wrap justify-center gap-6">
            <Link href="/terms" className="transition-colors hover:text-[#B5C49B]">
              Terms & Conditions
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-[#B5C49B]">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="transition-colors hover:text-[#B5C49B]">
              Cookie Policy
            </Link>
            <Link href="/health-declaration" className="transition-colors hover:text-[#B5C49B]">
              Health Declaration
            </Link>
            <Link href="/unsubscribe" className="transition-colors hover:text-[#B5C49B]">
              Manage Subscriptions
            </Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Shruti Turner. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
