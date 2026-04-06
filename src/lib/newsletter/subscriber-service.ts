import { AcceptanceType } from "@prisma/client";
import { db } from "@/lib/db";
import { recordAcceptanceEvent } from "@/lib/legal/acceptance-service";

export const DEFAULT_MARKETING_CONSENT_WORDING =
  "I want to receive marketing emails, newsletter updates, and occasional offers from Shruti Turner. I can unsubscribe at any time.";

type MarketingConsentInput = {
  source?: string;
  surface?: string;
  wordingText?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

async function ensureUserMarketingPreference(userId: string, marketingEmails: boolean) {
  await db.userNotificationPreference.upsert({
    where: { userId },
    create: {
      userId,
      marketingEmails,
      classReminders: true,
      scheduleUpdates: true,
      programAnnouncements: true,
    },
    update: {
      marketingEmails,
    },
  });
}

async function recordMarketingConsentIfNeeded(input: {
  userId?: string | null;
  shouldRecord: boolean;
  source?: string;
  surface?: string;
  wordingText?: string;
}) {
  if (!input.userId || !input.shouldRecord) {
    return;
  }

  await recordAcceptanceEvent({
    userId: input.userId,
    actorUserId: input.userId,
    type: AcceptanceType.marketing,
    surface: input.surface || "newsletter_signup",
    metadataJson: {
      source: input.source || "unknown",
      surface: input.surface || "newsletter_signup",
      wordingText: input.wordingText || DEFAULT_MARKETING_CONSENT_WORDING,
    },
  });
}

export async function ensureSubscriberLinkedToUser(userId: string, email: string) {
  const normalizedEmail = normalizeEmail(email);
  await db.newsletterSubscriber.updateMany({
    where: { email: normalizedEmail, userId: null },
    data: { userId },
  });
}

export async function subscribeMarketingEmail(input: {
  email: string;
  userId?: string | null;
  source?: string;
  surface?: string;
  wordingText?: string;
}) {
  const email = normalizeEmail(input.email);
  const existing = await db.newsletterSubscriber.findUnique({
    where: { email },
    select: { id: true, token: true, userId: true, status: true },
  });
  const linkedUserId = input.userId || existing?.userId || null;
  const shouldRecordConsent = existing?.status !== "subscribed";

  const subscriber = existing
    ? await db.newsletterSubscriber.update({
        where: { email },
        data: {
          userId: linkedUserId || undefined,
          source: input.source || undefined,
          status: "subscribed",
          subscribedAt: new Date(),
          unsubscribedAt: null,
        },
      })
    : await db.newsletterSubscriber.create({
        data: {
          email,
          userId: linkedUserId || undefined,
          source: input.source || undefined,
          status: "subscribed",
          token: createToken(),
        },
      });

  if (subscriber.userId) {
    await ensureUserMarketingPreference(subscriber.userId, true);
  }

  await recordMarketingConsentIfNeeded({
    userId: linkedUserId,
    shouldRecord: shouldRecordConsent,
    source: input.source,
    surface: input.surface,
    wordingText: input.wordingText,
  });

  return subscriber;
}

export async function unsubscribeMarketingEmailByToken(token: string) {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new Error("INVALID_TOKEN");
  }

  const subscriber = await db.newsletterSubscriber.findUnique({
    where: { token: trimmed },
    select: { id: true, email: true, userId: true },
  });
  if (!subscriber) {
    throw new Error("NOT_FOUND");
  }

  await db.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: {
      status: "unsubscribed",
      unsubscribedAt: new Date(),
    },
  });

  if (subscriber.userId) {
    await ensureUserMarketingPreference(subscriber.userId, false);
  }

  return subscriber.email;
}

export async function unsubscribeMarketingEmailByAddress(emailInput: string) {
  const email = normalizeEmail(emailInput);
  if (!email) throw new Error("INVALID_EMAIL");

  const subscriber = await db.newsletterSubscriber.findUnique({
    where: { email },
    select: { id: true, email: true, userId: true },
  });

  if (subscriber) {
    await db.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "unsubscribed",
        unsubscribedAt: new Date(),
      },
    });
    if (subscriber.userId) {
      await ensureUserMarketingPreference(subscriber.userId, false);
    }
    return subscriber.email;
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user) {
    throw new Error("NOT_FOUND");
  }

  await ensureUserMarketingPreference(user.id, false);
  await db.newsletterSubscriber.create({
    data: {
      email,
      userId: user.id,
      status: "unsubscribed",
      token: createToken(),
      unsubscribedAt: new Date(),
    },
  });

  return user.email;
}

export async function requestMarketingUnsubscribeByAddress(emailInput: string) {
  const email = normalizeEmail(emailInput);
  if (!email) throw new Error("INVALID_EMAIL");

  const subscriber = await db.newsletterSubscriber.findUnique({
    where: { email },
    select: { email: true, token: true },
  });

  if (!subscriber) {
    return null;
  }

  return {
    email: subscriber.email,
    token: subscriber.token,
  };
}

export async function syncMarketingPreferenceForUser(
  userId: string,
  marketingEmails: boolean,
  consent?: MarketingConsentInput
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) throw new Error("USER_NOT_FOUND");

  await ensureUserMarketingPreference(userId, marketingEmails);

  const existing = await db.newsletterSubscriber.findUnique({
    where: { email: normalizeEmail(user.email) },
    select: { id: true, token: true, status: true },
  });
  const shouldRecordConsent = marketingEmails && existing?.status !== "subscribed";

  if (existing) {
    await db.newsletterSubscriber.update({
      where: { id: existing.id },
      data: {
        userId,
        status: marketingEmails ? "subscribed" : "unsubscribed",
        subscribedAt: marketingEmails ? new Date() : undefined,
        unsubscribedAt: marketingEmails ? null : new Date(),
      },
    });
    await recordMarketingConsentIfNeeded({
      userId,
      shouldRecord: shouldRecordConsent,
      source: consent?.source || "account",
      surface: consent?.surface || "account_notifications",
      wordingText: consent?.wordingText,
    });
    return;
  }

  await db.newsletterSubscriber.create({
    data: {
      email: normalizeEmail(user.email),
      userId,
      status: marketingEmails ? "subscribed" : "unsubscribed",
      token: createToken(),
      subscribedAt: new Date(),
      unsubscribedAt: marketingEmails ? null : new Date(),
      source: "account",
    },
  });

  await recordMarketingConsentIfNeeded({
    userId,
    shouldRecord: marketingEmails,
    source: consent?.source || "account",
    surface: consent?.surface || "account_notifications",
    wordingText: consent?.wordingText,
  });
}

export async function getSubscriberByEmail(emailInput: string) {
  const email = normalizeEmail(emailInput);
  if (!email) return null;
  return db.newsletterSubscriber.findUnique({ where: { email } });
}
