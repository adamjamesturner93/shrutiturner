import { db } from "@/lib/db";
import { getReferralSummary } from "@/lib/referrals/referral-service";
import {
  CURRENT_HEALTH_DATA_CONSENT_VERSION,
  CURRENT_HEALTH_WAIVER_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/data/legal-documents";
import { linkPendingRecordsForUser } from "@/lib/link-pending-records";
import { syncMarketingPreferenceForUser } from "@/lib/newsletter/subscriber-service";

const DATE_FORMATS = new Set(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]);

type LegalAcceptanceShape = {
  acceptedTermsVersion: string | null;
  acceptedHealthWaiverVersion: string | null;
  acceptedHealthDataConsentVersion: string | null;
  termsAgreedAt: Date | null;
  healthAgreedAt: Date | null;
  healthDataConsentedAt: Date | null;
};

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
  hasConsentedToHealthData?: boolean;
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

function mapLegalAcceptance<T extends LegalAcceptanceShape>(user: T) {
  const hasCurrentTerms = user.acceptedTermsVersion === CURRENT_TERMS_VERSION;
  const hasCurrentHealthWaiver = user.acceptedHealthWaiverVersion === CURRENT_HEALTH_WAIVER_VERSION;
  const hasCurrentHealthDataConsent =
    user.acceptedHealthDataConsentVersion === CURRENT_HEALTH_DATA_CONSENT_VERSION;

  return {
    hasAgreedToTerms: hasCurrentTerms,
    hasAgreedToHealth: hasCurrentHealthWaiver,
    termsAgreedAt: user.termsAgreedAt ? user.termsAgreedAt.toISOString() : null,
    healthAgreedAt: user.healthAgreedAt ? user.healthAgreedAt.toISOString() : null,
    acceptedTermsVersion: user.acceptedTermsVersion,
    acceptedHealthWaiverVersion: user.acceptedHealthWaiverVersion,
    currentTermsVersion: CURRENT_TERMS_VERSION,
    currentHealthWaiverVersion: CURRENT_HEALTH_WAIVER_VERSION,
    needsTermsReacceptance: !hasCurrentTerms,
    needsHealthWaiverReacceptance: !hasCurrentHealthWaiver,
    hasConsentedToHealthData: hasCurrentHealthDataConsent,
    healthDataConsentedAt: user.healthDataConsentedAt
      ? user.healthDataConsentedAt.toISOString()
      : null,
    acceptedHealthDataConsentVersion: user.acceptedHealthDataConsentVersion,
    currentHealthDataConsentVersion: CURRENT_HEALTH_DATA_CONSENT_VERSION,
    needsHealthDataConsentRefresh: !hasCurrentHealthDataConsent,
  };
}

export async function getAccount(userId: string, siteUrl: string) {
  const accountUser = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!accountUser) throw new Error("USER_NOT_FOUND");

  await linkPendingRecordsForUser(accountUser.id, accountUser.email);

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
        acceptedTermsVersion: true,
        acceptedHealthWaiverVersion: true,
        hasConsentedToHealthData: true,
        acceptedHealthDataConsentVersion: true,
        termsAgreedAt: true,
        healthAgreedAt: true,
        healthDataConsentedAt: true,
        heardAboutSource: true,
        heardAboutDetail: true,
        isCoachingClient: true,
      },
    }),
    getOrCreateNotificationPreferences(userId),
    getReferralSummary(userId, siteUrl),
  ]);

  if (!user) throw new Error("USER_NOT_FOUND");

  const healthProfile = await db.healthProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  return {
    profile: {
      ...user,
      hasHealthProfile: Boolean(healthProfile),
      dob: user.dob ? user.dob.toISOString().slice(0, 10) : null,
      ...mapLegalAcceptance(user),
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
    acceptedTermsVersion?: string;
    acceptedHealthWaiverVersion?: string;
    hasConsentedToHealthData?: boolean;
    acceptedHealthDataConsentVersion?: string;
    termsAgreedAt?: Date;
    healthAgreedAt?: Date;
    healthDataConsentedAt?: Date;
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

  if (
    input.hasAgreedToTerms === true ||
    input.hasAgreedToHealth === true ||
    input.hasConsentedToHealthData === true
  ) {
    const existing = await db.user.findUnique({
      where: { id: userId },
      select: {
        acceptedTermsVersion: true,
        acceptedHealthWaiverVersion: true,
        acceptedHealthDataConsentVersion: true,
        termsAgreedAt: true,
        healthAgreedAt: true,
        healthDataConsentedAt: true,
      },
    });

    if (!existing) throw new Error("USER_NOT_FOUND");

    if (
      input.hasAgreedToTerms === true &&
      existing.acceptedTermsVersion !== CURRENT_TERMS_VERSION
    ) {
      data.hasAgreedToTerms = true;
      data.termsAgreedAt = new Date();
      data.acceptedTermsVersion = CURRENT_TERMS_VERSION;
    }

    if (
      input.hasAgreedToHealth === true &&
      existing.acceptedHealthWaiverVersion !== CURRENT_HEALTH_WAIVER_VERSION
    ) {
      data.hasAgreedToHealth = true;
      data.healthAgreedAt = new Date();
      data.acceptedHealthWaiverVersion = CURRENT_HEALTH_WAIVER_VERSION;
    }

    if (
      input.hasConsentedToHealthData === true &&
      existing.acceptedHealthDataConsentVersion !== CURRENT_HEALTH_DATA_CONSENT_VERSION
    ) {
      data.hasConsentedToHealthData = true;
      data.healthDataConsentedAt = new Date();
      data.acceptedHealthDataConsentVersion = CURRENT_HEALTH_DATA_CONSENT_VERSION;
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
      acceptedTermsVersion: true,
      acceptedHealthWaiverVersion: true,
      hasConsentedToHealthData: true,
      acceptedHealthDataConsentVersion: true,
      termsAgreedAt: true,
      healthAgreedAt: true,
      healthDataConsentedAt: true,
      heardAboutSource: true,
      heardAboutDetail: true,
    },
  });

  return {
    ...updated,
    dob: updated.dob ? updated.dob.toISOString().slice(0, 10) : null,
    ...mapLegalAcceptance(updated),
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

  const updated = await db.userNotificationPreference.update({
    where: { userId },
    data,
  });

  if (typeof data.marketingEmails === "boolean") {
    await syncMarketingPreferenceForUser(userId, data.marketingEmails);
  }

  return updated;
}
