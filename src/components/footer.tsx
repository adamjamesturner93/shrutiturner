import Link from "next/link";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { useNewsletterSignupCopy } from "@/lib/use-newsletter-signup-copy";
import { submitNewsletterSignup } from "@/lib/newsletter-signup";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { IconHorizontal } from "./icon";
import { usePlatformSettings } from "@/context/platform-settings-context";
import { Label } from "@/components/ui/label";

type FooterProps = {
  showNewsletter?: boolean;
  variant?: "marketing" | "utility";
};

export function Footer({ showNewsletter = true, variant = "marketing" }: FooterProps) {
  if (variant === "utility") {
    return <UtilityFooter />;
  }

  return <MarketingFooter showNewsletter={showNewsletter} />;
}

function UtilityFooter() {
  const { businessName } = usePlatformSettings();

  return (
    <footer className="bg-brand-dark text-brand-white mt-16 border-t">
      <div className="container mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-start">
          <div className="text-center md:text-left">
            <div role="img" aria-label={businessName}>
              <IconHorizontal tone="white" className="mx-auto h-9 w-auto md:mx-0" />
            </div>
            <p className="text-brand-white/65 mt-3 max-w-sm text-sm">
              Movement and fitness coaching built around real bodies and real life.
            </p>
          </div>

          <nav aria-label="Utility footer" className="max-w-2xl">
            <ul className="text-brand-white/70 flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm md:justify-end">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/coaching">Coaching</Link>
              </li>
              <li>
                <Link href="/blog">Blog</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
              <li>
                <Link href="/login">Client login</Link>
              </li>
              <li>
                <Link href="/unsubscribe">Email preferences</Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="border-brand-white/10 text-brand-white/50 mt-8 border-t pt-6 text-sm">
          <nav aria-label="Legal policies">
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-3">
              <li>
                <Link href="/terms">Terms</Link>
              </li>
              <li>
                <Link href="/privacy">Privacy</Link>
              </li>
              <li>
                <Link href="/cookies">Cookies</Link>
              </li>
              <li>
                <Link href="/health-declaration">Health declaration</Link>
              </li>
              <li>
                <Link href="/refund-policy">Refunds</Link>
              </li>
              <li>
                <Link href="/acceptable-use">Acceptable use</Link>
              </li>
            </ul>
          </nav>
          <p className="mt-5 text-center">Copyright {businessName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function MarketingFooter({ showNewsletter = true }: { showNewsletter?: boolean }) {
  const { businessName, instagramUrl } = usePlatformSettings();
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
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand + Newsletter */}
          <div className="space-y-6 sm:col-span-2 lg:col-span-2">
            <div role="img" aria-label={businessName}>
              <IconHorizontal tone="white" className="h-12 w-auto" />
            </div>
            <p className="text-brand-white/70 max-w-md leading-relaxed">
              Personal movement and fitness coaching bringing together rehabilitation, fitness and
              wellbeing. Built around your body, your goals and your real life.
            </p>

            {/* Newsletter in footer */}
            {showNewsletter ? (
              <div className="border-brand-white/15 bg-brand-white/5 rounded-lg border p-4">
                <h4 className="text-brand-accent-light text-sm tracking-wide uppercase">
                  Newsletter
                </h4>
                <p className="text-brand-white/75 mt-2 mb-3 text-sm">{signupCopy.hookText}</p>
                {!subscribed ? (
                  <form onSubmit={handleNewsletterSubmit} className="max-w-sm space-y-2">
                    <Label htmlFor="footer-newsletter-first-name" className="sr-only">
                      First name
                    </Label>
                    <Input
                      id="footer-newsletter-first-name"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Your first name"
                      required
                      className="border-brand-white/20 bg-brand-white/10 text-brand-white placeholder:text-brand-white/40"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Label htmlFor="footer-newsletter-email" className="sr-only">
                        Email address
                      </Label>
                      <Input
                        id="footer-newsletter-email"
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
                    aria-describedby="footer-newsletter-consent-copy"
                  />
                  <span>I want newsletter and update emails.</span>
                </label>
                <p id="footer-newsletter-consent-copy" className="text-brand-white/70 mt-1 text-xs">
                  {signupCopy.consentText}
                </p>
                {error ? <p className="mt-1 text-xs text-red-300">{error}</p> : null}
              </div>
            ) : null}
          </div>

          <nav aria-label="Explore">
            <h4 className="text-brand-accent-light mb-4">Explore</h4>
            <ul className="text-brand-white/70 space-y-2">
              <li>
                <Link href="/about" className="hover:text-brand-accent-light transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/coaching" className="hover:text-brand-accent-light transition-colors">
                  Coaching
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-brand-accent-light transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand-accent-light transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Client links">
            <h4 className="text-brand-accent-light mb-4">Client</h4>
            <ul className="text-brand-white/70 space-y-2">
              <li>
                <Link href="/login" className="hover:text-brand-accent-light transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/unsubscribe"
                  className="hover:text-brand-accent-light transition-colors"
                >
                  Email preferences
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h4 className="text-brand-accent-light mb-4">Social</h4>
            <div className="flex items-center gap-4">
              <a
                href="https://youtube.com/@shrutiturner"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-white/60 hover:text-brand-accent-light transition-colors"
                aria-label="Follow on YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href={instagramUrl || "https://instagram.com/shrutiturner"}
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

          <nav aria-label="Legal">
            <h4 className="text-brand-accent-light mb-4">Legal</h4>
            <ul className="text-brand-white/70 space-y-2">
              <li>
                <Link href="/terms" className="hover:text-brand-accent-light transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-brand-accent-light transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-brand-accent-light transition-colors">
                  Cookies
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="hover:text-brand-accent-light transition-colors"
                >
                  Refund policy
                </Link>
              </li>
              <li>
                <Link
                  href="/health-declaration"
                  className="hover:text-brand-accent-light transition-colors"
                >
                  Health declaration
                </Link>
              </li>
              <li>
                <Link
                  href="/acceptable-use"
                  className="hover:text-brand-accent-light transition-colors"
                >
                  Acceptable use
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="border-brand-white/10 text-brand-white/50 mt-12 border-t pt-8 text-center text-sm">
          <p>Copyright {businessName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
