import { AcceptanceType } from "@prisma/client";
import { db } from "@/lib/db";
import { getReferralSummary } from "@/lib/referrals/referral-service";
import {
  CURRENT_HEALTH_DATA_CONSENT_VERSION,
  CURRENT_HEALTH_WAIVER_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/data/legal-documents";
import { linkPendingRecordsForUser } from "@/lib/link-pending-records";
import { syncMarketingPreferenceForUser } from "@/lib/newsletter/subscriber-service";
import { deriveOnboardingState } from "@/lib/account/onboarding-service";
import { needsHealthDeclarationReview } from "@/lib/health/health-service";
import { recordAcceptanceEvent } from "@/lib/legal/acceptance-service";
import type { HealthDeclarationStatusDto } from "@/lib/api/types";

const ACCOUNT_MARKETING_CONSENT_WORDING =
  "I want to receive marketing emails, newsletter updates, and occasional offers from Shruti Turner. I can unsubscribe at any time.";

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

function mapNotificationPreferences<T extends { updatedAt: Date }>(
  preferences: T
): Omit<T, "updatedAt"> & { updatedAt: string } {
  return {
    ...preferences,
    updatedAt: preferences.updatedAt.toISOString(),
  };
}

function mapHealthDeclaration(
  profile: {
    declarationStatus: "none_declared" | "context_declared";
    lastConfirmedAt: Date;
    tracksFlareCheckIns: boolean;
  } | null
) {
  const healthDeclarationStatus: HealthDeclarationStatusDto =
    profile?.declarationStatus ?? "incomplete";
  const healthDeclarationLastConfirmedAt = profile?.lastConfirmedAt.toISOString() ?? "";

  return {
    hasHealthProfile: healthDeclarationStatus !== "incomplete",
    healthDeclarationStatus,
    healthDeclarationLastConfirmedAt,
    healthDeclarationNeedsReview: needsHealthDeclarationReview(profile?.lastConfirmedAt),
    tracksFlareCheckIns: profile?.tracksFlareCheckIns ?? false,
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
    select: {
      declarationStatus: true,
      lastConfirmedAt: true,
      tracksFlareCheckIns: true,
    },
  });
  const healthDeclaration = mapHealthDeclaration(healthProfile);

  return {
    profile: {
      ...user,
      ...healthDeclaration,
      dob: user.dob ? user.dob.toISOString().slice(0, 10) : null,
      ...mapLegalAcceptance(user),
      onboarding: deriveOnboardingState({
        firstName: user.firstName,
        lastName: user.lastName,
        dob: user.dob,
        isOnboarded: user.isOnboarded,
        hasAgreedToTerms: user.acceptedTermsVersion === CURRENT_TERMS_VERSION,
        hasAgreedToHealth: user.acceptedHealthWaiverVersion === CURRENT_HEALTH_WAIVER_VERSION,
        heardAboutSource: user.heardAboutSource,
        hasHealthProfile: healthDeclaration.hasHealthProfile,
        healthDeclarationStatus: healthDeclaration.healthDeclarationStatus,
        hasConsentedToHealthData:
          user.acceptedHealthDataConsentVersion === CURRENT_HEALTH_DATA_CONSENT_VERSION,
        needsHealthDataConsentRefresh:
          user.acceptedHealthDataConsentVersion !== CURRENT_HEALTH_DATA_CONSENT_VERSION,
      }),
    },
    notifications: mapNotificationPreferences(notifications),
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
    heardAboutSource?: string | null;
    heardAboutDetail?: string | null;
    isOnboarded?: boolean;
  } = {};
  const acceptancesToRecord: AcceptanceType[] = [];

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
      acceptancesToRecord.push(AcceptanceType.terms);
    }

    if (
      input.hasAgreedToHealth === true &&
      existing.acceptedHealthWaiverVersion !== CURRENT_HEALTH_WAIVER_VERSION
    ) {
      acceptancesToRecord.push(AcceptanceType.health_waiver);
    }

    if (
      input.hasConsentedToHealthData === true &&
      existing.acceptedHealthDataConsentVersion !== CURRENT_HEALTH_DATA_CONSENT_VERSION
    ) {
      acceptancesToRecord.push(AcceptanceType.health_data);
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

  await db.user.update({
    where: { id: userId },
    data,
  });

  for (const type of acceptancesToRecord) {
    await recordAcceptanceEvent({
      userId,
      actorUserId: userId,
      type,
      surface: input.isOnboarded ? "account_onboarding" : "account_profile",
    });
  }

  const updated = await db.user.findUnique({
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
    },
  });

  if (!updated) throw new Error("USER_NOT_FOUND");

  const healthProfile = await db.healthProfile.findUnique({
    where: { userId },
    select: {
      declarationStatus: true,
      lastConfirmedAt: true,
      tracksFlareCheckIns: true,
    },
  });
  const healthDeclaration = mapHealthDeclaration(healthProfile);

  return {
    ...updated,
    ...healthDeclaration,
    dob: updated.dob ? updated.dob.toISOString().slice(0, 10) : null,
    ...mapLegalAcceptance(updated),
    onboarding: deriveOnboardingState({
      firstName: updated.firstName,
      lastName: updated.lastName,
      dob: updated.dob,
      isOnboarded: updated.isOnboarded,
      hasAgreedToTerms: updated.acceptedTermsVersion === CURRENT_TERMS_VERSION,
      hasAgreedToHealth: updated.acceptedHealthWaiverVersion === CURRENT_HEALTH_WAIVER_VERSION,
      heardAboutSource: updated.heardAboutSource,
      hasHealthProfile: healthDeclaration.hasHealthProfile,
      healthDeclarationStatus: healthDeclaration.healthDeclarationStatus,
      hasConsentedToHealthData:
        updated.acceptedHealthDataConsentVersion === CURRENT_HEALTH_DATA_CONSENT_VERSION,
      needsHealthDataConsentRefresh:
        updated.acceptedHealthDataConsentVersion !== CURRENT_HEALTH_DATA_CONSENT_VERSION,
    }),
  };
}

export async function getNotificationPreferences(userId: string) {
  const preferences = await getOrCreateNotificationPreferences(userId);
  return mapNotificationPreferences(preferences);
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
    await syncMarketingPreferenceForUser(userId, data.marketingEmails, {
      source: "account",
      surface: "account_notifications",
      wordingText: ACCOUNT_MARKETING_CONSENT_WORDING,
    });
  }

  return mapNotificationPreferences(updated);
}
