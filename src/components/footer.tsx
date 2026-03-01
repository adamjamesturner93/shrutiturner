import Link from "next/link";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Instagram, Facebook } from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    console.log("Footer newsletter signup:", email);
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setEmail("");
    }, 3000);
  };

  return (
    <footer className="border-t bg-[#2E1F33] text-[#FAFAF8] mt-24">
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand + Newsletter */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl mb-2">Shruti Turner</h3>
            <p className="text-[#FAFAF8]/70 leading-relaxed max-w-md">
              Science-backed strength and yoga coaching for people with chronic
              illness, autoimmune conditions, and complex bodies. PhD
              Biomechanics. Living with psoriatic arthritis.
            </p>

            {/* Newsletter in footer */}
            <div className="pt-2">
              <p className="text-sm text-[#B5C49B] mb-3">
                Get "5 Yoga Poses That Actually Build Strength" — free:
              </p>
              {!subscribed ? (
                <form
                  onSubmit={handleNewsletterSubmit}
                  className="flex gap-2 max-w-sm"
                >
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="bg-[#FAFAF8]/10 border-[#FAFAF8]/20 text-[#FAFAF8] placeholder:text-[#FAFAF8]/40"
                  />
                  <Button
                    type="submit"
                    className="bg-[#B5C49B] text-[#2E1F33] hover:bg-[#a5b48b] flex-shrink-0"
                  >
                    Subscribe
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-[#B5C49B]">
                  You're subscribed! Check your inbox.
                </p>
              )}
              <p className="text-xs text-[#FAFAF8]/40 mt-2">
                No spam. Unsubscribe anytime.
              </p>
            </div>

            {/* Social Media */}
            <div className="flex items-center gap-4 pt-2">
              <a
                href="https://instagram.com/shrutiturner"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FAFAF8]/60 hover:text-[#B5C49B] transition-colors"
                aria-label="Follow on Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com/shrutiturner"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FAFAF8]/60 hover:text-[#B5C49B] transition-colors"
                aria-label="Follow on Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-[#B5C49B] mb-4">Services</h4>
            <ul className="space-y-2 text-[#FAFAF8]/70">
              <li>
                <Link
                  href="/classes/yoga"
                  className="hover:text-[#B5C49B] transition-colors"
                >
                  Yoga Classes
                </Link>
              </li>
              <li>
                <Link
                  href="/classes/strength"
                  className="hover:text-[#B5C49B] transition-colors"
                >
                  Strength Classes
                </Link>
              </li>
              <li>
                <Link
                  href="/classes/small-groups"
                  className="hover:text-[#B5C49B] transition-colors"
                >
                  Small Group Programs
                </Link>
              </li>
              <li>
                <Link
                  href="/pt"
                  className="hover:text-[#B5C49B] transition-colors"
                >
                  1:1 Training
                </Link>
              </li>
              <li>
                <Link
                  href="/retreats"
                  className="hover:text-[#B5C49B] transition-colors"
                >
                  Retreats
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-[#B5C49B] transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/schedule"
                  className="hover:text-[#B5C49B] transition-colors"
                >
                  Schedule
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[#B5C49B] mb-4">Company</h4>
            <ul className="space-y-2 text-[#FAFAF8]/70">
              <li>
                <Link
                  href="/about"
                  className="hover:text-[#B5C49B] transition-colors"
                >
                  About Shruti
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-[#B5C49B] transition-colors"
                >
                  Blog & Resources
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-[#B5C49B] transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-[#B5C49B] transition-colors"
                >
                  Client Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[#FAFAF8]/10 text-center text-sm text-[#FAFAF8]/50">
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            <Link
              href="/terms"
              className="hover:text-[#B5C49B] transition-colors"
            >
              Terms & Conditions
            </Link>
            <Link
              href="/privacy"
              className="hover:text-[#B5C49B] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/cookies"
              className="hover:text-[#B5C49B] transition-colors"
            >
              Cookie Policy
            </Link>
            <Link
              href="/health-declaration"
              className="hover:text-[#B5C49B] transition-colors"
            >
              Health Declaration
            </Link>
            <Link
              href="/unsubscribe"
              className="hover:text-[#B5C49B] transition-colors"
            >
              Manage Subscriptions
            </Link>
          </div>
          <p>
            &copy; {new Date().getFullYear()} Shruti Turner. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}