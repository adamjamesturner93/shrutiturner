import { createHmac } from "node:crypto";
import { db } from "@/lib/db";

type NewsletterSignupEventType =
  | "subscribe_attempt"
  | "subscribe_pending"
  | "already_subscribed"
  | "verify_success"
  | "verify_invalid"
  | "lead_magnet_sent";

function getHashSecret() {
  return (
    process.env.NEWSLETTER_EVENT_SECRET ||
    process.env.AUTH_SECRET ||
    "development-newsletter-secret"
  );
}

function hashEmail(email: string) {
  return createHmac("sha256", getHashSecret()).update(email.trim().toLowerCase()).digest("hex");
}

export async function recordNewsletterSignupEvent(input: {
  email: string;
  source: string;
  eventType: NewsletterSignupEventType;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  return db.newsletterSignupEvent.create({
    data: {
      hashedEmail: hashEmail(input.email),
      source: input.source,
      eventType: input.eventType,
      metadataJson: input.metadata,
    },
  });
}
