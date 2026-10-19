"use client";

import { useEffect, useState } from "react";
import type { NewsletterSignupContent } from "@/lib/content/types";
import {
  CANONICAL_LEAD_MAGNET,
  NEWSLETTER_HEADLINE,
  NEWSLETTER_BODY,
  NEWSLETTER_BUTTON,
} from "@/lib/newsletter/lead-magnet";

const DEFAULT_SIGNUP_COPY: NewsletterSignupContent = {
  slug: "default",
  hookText: NEWSLETTER_HEADLINE,
  formPlaceholder: "your.email@example.com",
  buttonLabel: NEWSLETTER_BUTTON,
  successMessage: "Please check your inbox to confirm your email address.",
  consentText: "No spam. Unsubscribe anytime.",
  popupTitle: NEWSLETTER_HEADLINE,
  popupDescription: NEWSLETTER_BODY,
  leadMagnetTitle: CANONICAL_LEAD_MAGNET.title,
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
            // Approved general invitation; preserve provider consent and guide-specific content.
            hookText: NEWSLETTER_HEADLINE,
            popupTitle: NEWSLETTER_HEADLINE,
            popupDescription: NEWSLETTER_BODY,
            buttonLabel: NEWSLETTER_BUTTON,
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
