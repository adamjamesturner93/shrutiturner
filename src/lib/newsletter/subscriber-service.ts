import { db } from "@/lib/db";

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
}) {
  const email = normalizeEmail(input.email);
  const existing = await db.newsletterSubscriber.findUnique({
    where: { email },
    select: { id: true, token: true, userId: true },
  });

  const subscriber = existing
    ? await db.newsletterSubscriber.update({
        where: { email },
        data: {
          userId: input.userId || existing.userId || undefined,
          source: input.source || undefined,
          status: "subscribed",
          subscribedAt: new Date(),
          unsubscribedAt: null,
        },
      })
    : await db.newsletterSubscriber.create({
        data: {
          email,
          userId: input.userId || undefined,
          source: input.source || undefined,
          status: "subscribed",
          token: createToken(),
        },
      });

  if (subscriber.userId) {
    await ensureUserMarketingPreference(subscriber.userId, true);
  }

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

export async function syncMarketingPreferenceForUser(userId: string, marketingEmails: boolean) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) throw new Error("USER_NOT_FOUND");

  await ensureUserMarketingPreference(userId, marketingEmails);

  const existing = await db.newsletterSubscriber.findUnique({
    where: { email: normalizeEmail(user.email) },
    select: { id: true, token: true },
  });

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
}

export async function getSubscriberByEmail(emailInput: string) {
  const email = normalizeEmail(emailInput);
  if (!email) return null;
  return db.newsletterSubscriber.findUnique({ where: { email } });
}
