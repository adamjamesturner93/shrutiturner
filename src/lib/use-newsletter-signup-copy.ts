"use client";

import { useEffect, useState } from "react";
import type { NewsletterSignupContent } from "@/lib/content";

const DEFAULT_SIGNUP_COPY: NewsletterSignupContent = {
  slug: "default",
  hookText: 'Get "5 Yoga Poses That Actually Build Strength" - free:',
  formPlaceholder: "your.email@example.com",
  buttonLabel: "Subscribe",
  successMessage: "You're subscribed! Check your inbox.",
  consentText: "No spam. Unsubscribe anytime.",
  popupTitle: "Get Evidence-Based Insights",
  popupDescription:
    "Join the mailing list for research-backed articles on strength, movement, and chronic illness management. No spam, unsubscribe anytime.",
};

export function useNewsletterSignupCopy() {
  const [copy, setCopy] = useState<NewsletterSignupContent>(DEFAULT_SIGNUP_COPY);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/content/newsletter-signup");
        if (!res.ok) return;
        const data = (await res.json()) as NewsletterSignupContent;
        if (active) {
          setCopy({
            ...DEFAULT_SIGNUP_COPY,
            ...data,
          });
        }
      } catch {
        // Keep defaults on failure.
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return copy;
}
