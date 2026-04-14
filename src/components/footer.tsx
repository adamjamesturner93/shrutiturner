import Link from "next/link";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { useNewsletterSignupCopy } from "@/lib/use-newsletter-signup-copy";
import { submitNewsletterSignup } from "@/lib/newsletter-signup";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { IconHorizontal } from "./icon";

export function Footer() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
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
      firstName,
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
      setFirstName("");
      setConsent(false);
      setTurnstileToken("");
    }, 3000);
  };

  return (
    <footer className="bg-brand-dark text-brand-white mt-24 border-t">
      <div className="container mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand + Newsletter */}
          <div className="space-y-6 lg:col-span-2">
            <div role="img" aria-label="Shruti Turner">
              <IconHorizontal tone="white" className="h-12 w-auto" />
            </div>
            <p className="text-brand-white/70 max-w-md leading-relaxed">
              Science-backed strength and yoga coaching for people with chronic illness, autoimmune
              conditions, and complex bodies. PhD Biomechanics. Living with psoriatic arthritis.
            </p>

            {/* Newsletter in footer */}
            <div className="border-brand-white/15 bg-brand-white/5 rounded-lg border p-4">
              <h4 className="text-brand-accent-light text-sm tracking-wide uppercase">
                Newsletter
              </h4>
              <p className="text-brand-white/75 mt-2 mb-3 text-sm">{signupCopy.hookText}</p>
              {!subscribed ? (
                <form onSubmit={handleNewsletterSubmit} className="max-w-sm space-y-2">
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Your first name"
                    required
                    className="border-brand-white/20 bg-brand-white/10 text-brand-white placeholder:text-brand-white/40"
                  />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={signupCopy.formPlaceholder}
                      required
                      className="border-brand-white/20 bg-brand-white/10 text-brand-white placeholder:text-brand-white/40"
                    />
                    <Button
                      type="submit"
                      className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90 flex-shrink-0"
                      disabled={isSubmitting || !consent || !turnstileToken}
                    >
                      {isSubmitting ? "Subscribing..." : signupCopy.buttonLabel}
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-brand-accent-light text-sm">{signupCopy.successMessage}</p>
              )}
              {!subscribed ? (
                <div className="mt-3">
                  <TurnstileWidget
                    onTokenChange={setTurnstileToken}
                    className="border-brand-white/30 bg-brand-white/8 text-brand-white/80"
                  />
                </div>
              ) : null}
              <label className="text-brand-white/60 mt-2 flex cursor-pointer items-start gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="accent-brand-accent-light mt-0.5 h-3.5 w-3.5"
                  required
                />
                <span>I want newsletter and update emails. I can unsubscribe anytime.</span>
              </label>
              <p className="text-brand-white/70 mt-1 text-xs">{signupCopy.consentText}</p>
              {error ? <p className="mt-1 text-xs text-red-300">{error}</p> : null}
            </div>

            {/* Social Media */}
            <div className="flex items-center gap-4 pt-2">
              <a
                href="https://youtube.com/@TheChronicYogini"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-white/60 hover:text-brand-accent-light transition-colors"
                aria-label="Follow on YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com/shrutiturner"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-white/60 hover:text-brand-accent-light transition-colors"
                aria-label="Follow on Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com/profile.php?id=61556124191934"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-white/60 hover:text-brand-accent-light transition-colors"
                aria-label="Follow on Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-brand-accent-light mb-4">Services</h4>
            <ul className="text-brand-white/70 space-y-2">
              <li>
                <Link href="/classes" className="hover:text-brand-accent-light transition-colors">
                  Move Well Classes
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="hover:text-brand-accent-light transition-colors">
                  Schedule
                </Link>
              </li>
              <li>
                <Link
                  href="/classes/small-groups"
                  className="hover:text-brand-accent-light transition-colors"
                >
                  Small Group Programmes
                </Link>
              </li>
              <li>
                <Link href="/coaching" className="hover:text-brand-accent-light transition-colors">
                  Coaching
                </Link>
              </li>
              <li>
                <Link href="/retreats" className="hover:text-brand-accent-light transition-colors">
                  Retreats
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-brand-accent-light transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-brand-accent-light mb-4">Company</h4>
            <ul className="text-brand-white/70 space-y-2">
              <li>
                <Link href="/about" className="hover:text-brand-accent-light transition-colors">
                  About Shruti
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-brand-accent-light transition-colors">
                  Blog & Resources
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand-accent-light transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-brand-accent-light transition-colors">
                  Client Login
                </Link>
              </li>
              <li>
                <Link
                  href="/unsubscribe"
                  className="hover:text-brand-accent-light transition-colors"
                >
                  Manage Subscriptions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-brand-white/10 text-brand-white/50 mt-12 border-t pt-8 text-center text-sm">
          <div className="mb-4 flex flex-wrap justify-center gap-6">
            <Link href="/terms" className="hover:text-brand-accent-light transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/privacy" className="hover:text-brand-accent-light transition-colors">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="hover:text-brand-accent-light transition-colors">
              Cookie Policy
            </Link>
            <Link
              href="/health-declaration"
              className="hover:text-brand-accent-light transition-colors"
            >
              Health & Liability Waiver
            </Link>
            <Link href="/refund-policy" className="hover:text-brand-accent-light transition-colors">
              Refund & Cancellation Policy
            </Link>
            <Link
              href="/acceptable-use"
              className="hover:text-brand-accent-light transition-colors"
            >
              Acceptable Use Policy
            </Link>
          </div>
          <p>Copyright Shruti Turner. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
