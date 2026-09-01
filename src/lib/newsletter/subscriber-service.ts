import { AcceptanceType } from "@prisma/client";
import { db } from "@/lib/db";
import { recordAcceptanceEvent } from "@/lib/legal/acceptance-service";
import {
  createSignedUnsubscribeToken,
  createVerificationToken,
  hashVerificationToken,
  verifySignedUnsubscribeToken,
} from "@/lib/newsletter/tokens";

export const DEFAULT_MARKETING_CONSENT_WORDING =
  "I want to receive marketing emails, newsletter updates and occasional offers from Shruti Turner. I can unsubscribe at any time.";

type MarketingConsentInput = {
  source?: string;
  surface?: string;
  wordingText?: string;
};

type PendingMarketingSubscriberInput = {
  email: string;
  firstName: string;
  userId?: string | null;
  source?: string;
  surface?: string;
  wordingText?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeFirstName(firstName: string) {
  return firstName.trim().slice(0, 80);
}

function createLegacyToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

async function ensureUserMarketingPreference(userId: string, marketingEmails: boolean) {
  void userId;
  void marketingEmails;
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

export async function createPendingMarketingSubscriber(input: PendingMarketingSubscriberInput) {
  const email = normalizeEmail(input.email);
  const firstName = normalizeFirstName(input.firstName);
  const existing = await db.newsletterSubscriber.findUnique({
    where: { email },
    select: {
      id: true,
      token: true,
      userId: true,
      status: true,
      firstName: true,
      source: true,
      verifiedAt: true,
      subscribedAt: true,
    },
  });
  const linkedUserId = input.userId || existing?.userId || null;

  if (existing?.status === "subscribed" && existing.verifiedAt) {
    if (linkedUserId && linkedUserId !== existing.userId) {
      await ensureUserMarketingPreference(linkedUserId, true);
    }

    await recordMarketingConsentIfNeeded({
      userId: linkedUserId,
      shouldRecord: false,
      source: input.source,
      surface: input.surface,
      wordingText: input.wordingText,
    });

    return {
      state: "subscribed" as const,
      subscriber: await db.newsletterSubscriber.update({
        where: { email },
        data: {
          firstName: firstName || existing.firstName || undefined,
          userId: linkedUserId || undefined,
          source: input.source || existing.source || undefined,
        },
      }),
      verificationToken: null,
    };
  }

  const verificationToken = createVerificationToken();
  const verificationTokenHash = hashVerificationToken(verificationToken);
  const now = new Date();
  const verificationTokenExpiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24);

  const subscriber = existing
    ? await db.newsletterSubscriber.update({
        where: { email },
        data: {
          firstName: firstName || existing.firstName || undefined,
          userId: linkedUserId || undefined,
          source: input.source || existing.source || undefined,
          status: "pending",
          consentedAt: now,
          subscribedAt: existing.subscribedAt || now,
          verifiedAt: null,
          verificationTokenHash,
          verificationTokenExpiresAt,
          unsubscribedAt: null,
        },
      })
    : await db.newsletterSubscriber.create({
        data: {
          email,
          firstName,
          userId: linkedUserId || undefined,
          source: input.source || undefined,
          status: "pending",
          token: createLegacyToken(),
          consentedAt: now,
          subscribedAt: now,
          verificationTokenHash,
          verificationTokenExpiresAt,
        },
      });

  await recordMarketingConsentIfNeeded({
    userId: linkedUserId,
    shouldRecord: true,
    source: input.source,
    surface: input.surface,
    wordingText: input.wordingText,
  });

  return {
    state: "pending" as const,
    subscriber,
    verificationToken,
  };
}

export async function verifyMarketingEmailByToken(token: string) {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new Error("INVALID_TOKEN");
  }

  const verificationTokenHash = hashVerificationToken(trimmed);
  const subscriber = await db.newsletterSubscriber.findFirst({
    where: {
      verificationTokenHash,
      status: "pending",
      verificationTokenExpiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!subscriber) {
    throw new Error("INVALID_TOKEN");
  }

  const verifiedAt = new Date();
  const verifiedSubscriber = await db.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: {
      status: "subscribed",
      verifiedAt,
      subscribedAt: verifiedAt,
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
      unsubscribedAt: null,
    },
  });

  if (verifiedSubscriber.userId) {
    await ensureUserMarketingPreference(verifiedSubscriber.userId, true);
  }

  return verifiedSubscriber;
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
  const now = new Date();

  const subscriber = existing
    ? await db.newsletterSubscriber.update({
        where: { email },
        data: {
          userId: linkedUserId || undefined,
          source: input.source || undefined,
          status: "subscribed",
          consentedAt: now,
          subscribedAt: now,
          verifiedAt: now,
          verificationTokenHash: null,
          verificationTokenExpiresAt: null,
          unsubscribedAt: null,
        },
      })
    : await db.newsletterSubscriber.create({
        data: {
          email,
          userId: linkedUserId || undefined,
          source: input.source || undefined,
          status: "subscribed",
          token: createLegacyToken(),
          consentedAt: now,
          subscribedAt: now,
          verifiedAt: now,
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

async function getSubscriberForUnsubscribeToken(token: string) {
  try {
    const subscriberId = verifySignedUnsubscribeToken(token);
    return await db.newsletterSubscriber.findUnique({
      where: { id: subscriberId },
      select: { id: true, email: true, userId: true, status: true },
    });
  } catch {
    return db.newsletterSubscriber.findUnique({
      where: { token },
      select: { id: true, email: true, userId: true, status: true },
    });
  }
}

export async function unsubscribeMarketingEmailByToken(token: string) {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new Error("INVALID_TOKEN");
  }

  const subscriber = await getSubscriberForUnsubscribeToken(trimmed);
  if (!subscriber) {
    throw new Error("NOT_FOUND");
  }

  if (subscriber.status !== "unsubscribed") {
    await db.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "unsubscribed",
        unsubscribedAt: new Date(),
        verificationTokenHash: null,
        verificationTokenExpiresAt: null,
      },
    });
  }

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
        verificationTokenHash: null,
        verificationTokenExpiresAt: null,
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
      token: createLegacyToken(),
      subscribedAt: new Date(),
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
    select: { email: true, id: true },
  });

  if (!subscriber) {
    return null;
  }

  return {
    email: subscriber.email,
    token: createSignedUnsubscribeToken(subscriber.id),
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
  const now = new Date();

  if (existing) {
    await db.newsletterSubscriber.update({
      where: { id: existing.id },
      data: {
        userId,
        status: marketingEmails ? "subscribed" : "unsubscribed",
        consentedAt: marketingEmails ? now : undefined,
        subscribedAt: marketingEmails ? now : undefined,
        verifiedAt: marketingEmails ? now : undefined,
        verificationTokenHash: null,
        verificationTokenExpiresAt: null,
        unsubscribedAt: marketingEmails ? null : now,
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
      token: createLegacyToken(),
      consentedAt: marketingEmails ? now : undefined,
      subscribedAt: now,
      verifiedAt: marketingEmails ? now : undefined,
      unsubscribedAt: marketingEmails ? null : now,
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
