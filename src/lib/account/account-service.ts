import { db } from "@/lib/db";
import { getReferralSummary } from "@/lib/referrals/referral-service";

const DATE_FORMATS = new Set(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]);

export type AccountUpdateInput = {
  firstName?: string;
  lastName?: string;
  dob?: string | null;
  gender?: string | null;
  ethnicity?: string | null;
  timezone?: string;
  dateFormat?: string;
  hasAgreedToTerms?: boolean;
  hasAgreedToHealth?: boolean;
  heardAboutSource?: string | null;
  heardAboutDetail?: string | null;
  isOnboarded?: boolean;
};

export type NotificationPreferenceInput = {
  classReminders?: boolean;
  scheduleUpdates?: boolean;
  programAnnouncements?: boolean;
  marketingEmails?: boolean;
};

function calculateAge(dob: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

async function getOrCreateNotificationPreferences(userId: string) {
  const existing = await db.userNotificationPreference.findUnique({ where: { userId } });
  if (existing) return existing;
  return db.userNotificationPreference.create({ data: { userId } });
}

export async function getAccount(userId: string, siteUrl: string) {
  const [user, notifications, referral] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        dob: true,
        gender: true,
        ethnicity: true,
        timezone: true,
        dateFormat: true,
        isOnboarded: true,
        hasAgreedToTerms: true,
        hasAgreedToHealth: true,
        termsAgreedAt: true,
        healthAgreedAt: true,
        heardAboutSource: true,
        heardAboutDetail: true,
      },
    }),
    getOrCreateNotificationPreferences(userId),
    getReferralSummary(userId, siteUrl),
  ]);

  if (!user) throw new Error("USER_NOT_FOUND");

  return {
    profile: {
      ...user,
      dob: user.dob ? user.dob.toISOString().slice(0, 10) : null,
      termsAgreedAt: user.termsAgreedAt ? user.termsAgreedAt.toISOString() : null,
      healthAgreedAt: user.healthAgreedAt ? user.healthAgreedAt.toISOString() : null,
    },
    notifications,
    referral,
  };
}

export async function updateAccount(userId: string, input: AccountUpdateInput) {
  const data: {
    firstName?: string;
    lastName?: string;
    name?: string;
    dob?: Date | null;
    gender?: string | null;
    ethnicity?: string | null;
    timezone?: string;
    dateFormat?: string;
    hasAgreedToTerms?: boolean;
    hasAgreedToHealth?: boolean;
    termsAgreedAt?: Date;
    healthAgreedAt?: Date;
    heardAboutSource?: string | null;
    heardAboutDetail?: string | null;
    isOnboarded?: boolean;
  } = {};

  if (typeof input.firstName === "string") data.firstName = input.firstName.trim().slice(0, 80);
  if (typeof input.lastName === "string") data.lastName = input.lastName.trim().slice(0, 80);

  if (data.firstName !== undefined || data.lastName !== undefined) {
    const existing = await db.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    if (!existing) throw new Error("USER_NOT_FOUND");

    const firstName = data.firstName ?? existing.firstName ?? "";
    const lastName = data.lastName ?? existing.lastName ?? "";
    const fullName = `${firstName} ${lastName}`.trim();
    data.name = fullName || undefined;
  }

  if (input.dob !== undefined) {
    if (!input.dob) {
      data.dob = null;
    } else {
      const parsedDob = new Date(input.dob);
      if (Number.isNaN(parsedDob.getTime())) {
        throw new Error("INVALID_DOB");
      }
      if (calculateAge(parsedDob) < 18) {
        throw new Error("UNDER_18");
      }
      data.dob = parsedDob;
    }
  }

  if (input.gender !== undefined)
    data.gender = input.gender ? input.gender.trim().slice(0, 80) : null;
  if (input.ethnicity !== undefined) {
    data.ethnicity = input.ethnicity ? input.ethnicity.trim().slice(0, 120) : null;
  }
  if (typeof input.timezone === "string") data.timezone = input.timezone.trim();
  if (typeof input.dateFormat === "string") {
    if (!DATE_FORMATS.has(input.dateFormat)) throw new Error("INVALID_DATE_FORMAT");
    data.dateFormat = input.dateFormat;
  }

  if (input.hasAgreedToTerms === true || input.hasAgreedToHealth === true) {
    const existing = await db.user.findUnique({
      where: { id: userId },
      select: {
        hasAgreedToTerms: true,
        hasAgreedToHealth: true,
        termsAgreedAt: true,
        healthAgreedAt: true,
      },
    });

    if (!existing) throw new Error("USER_NOT_FOUND");

    if (
      input.hasAgreedToTerms === true &&
      (!existing.hasAgreedToTerms || !existing.termsAgreedAt)
    ) {
      data.hasAgreedToTerms = true;
      data.termsAgreedAt = new Date();
    }

    if (
      input.hasAgreedToHealth === true &&
      (!existing.hasAgreedToHealth || !existing.healthAgreedAt)
    ) {
      data.hasAgreedToHealth = true;
      data.healthAgreedAt = new Date();
    }
  }

  if (input.heardAboutSource !== undefined) {
    data.heardAboutSource = input.heardAboutSource
      ? input.heardAboutSource.trim().slice(0, 120)
      : null;
  }

  if (input.heardAboutDetail !== undefined) {
    data.heardAboutDetail = input.heardAboutDetail
      ? input.heardAboutDetail.trim().slice(0, 400)
      : null;
  }

  if (typeof input.isOnboarded === "boolean") {
    data.isOnboarded = input.isOnboarded;
  }

  const updated = await db.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      name: true,
      email: true,
      dob: true,
      gender: true,
      ethnicity: true,
      timezone: true,
      dateFormat: true,
      isOnboarded: true,
      hasAgreedToTerms: true,
      hasAgreedToHealth: true,
      termsAgreedAt: true,
      healthAgreedAt: true,
      heardAboutSource: true,
      heardAboutDetail: true,
    },
  });

  return {
    ...updated,
    dob: updated.dob ? updated.dob.toISOString().slice(0, 10) : null,
    termsAgreedAt: updated.termsAgreedAt ? updated.termsAgreedAt.toISOString() : null,
    healthAgreedAt: updated.healthAgreedAt ? updated.healthAgreedAt.toISOString() : null,
  };
}

export async function getNotificationPreferences(userId: string) {
  return getOrCreateNotificationPreferences(userId);
}

export async function updateNotificationPreferences(
  userId: string,
  input: NotificationPreferenceInput
) {
  await getOrCreateNotificationPreferences(userId);

  const data: NotificationPreferenceInput = {};
  for (const key of [
    "classReminders",
    "scheduleUpdates",
    "programAnnouncements",
    "marketingEmails",
  ] as const) {
    if (typeof input[key] === "boolean") data[key] = input[key];
  }

  return db.userNotificationPreference.update({
    where: { userId },
    data,
  });
}
