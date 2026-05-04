import { AcceptanceType, AuthChallengePurpose } from "@prisma/client";
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
import { issueAuthChallenge, normalizeEmail, verifyAuthChallenge } from "@/lib/auth-challenge";
import { sendAuthCodeEmail } from "@/lib/auth-code";
import { sendWelcomeEmail } from "@/lib/email";
import { needsHealthDeclarationReview } from "@/lib/health/health-service";
import {
  isAcceptanceDateFresh,
  PHYSICAL_SERVICE_HEALTH_WAIVER_MAX_AGE_DAYS,
  recordAcceptanceEvent,
} from "@/lib/legal/acceptance-service";
import { recordUserLifecycleEvent } from "@/lib/user-lifecycle";
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
  const hasCurrentHealthWaiver =
    user.acceptedHealthWaiverVersion === CURRENT_HEALTH_WAIVER_VERSION &&
    isAcceptanceDateFresh(user.healthAgreedAt, PHYSICAL_SERVICE_HEALTH_WAIVER_MAX_AGE_DAYS);
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
        hasAgreedToHealth:
          user.acceptedHealthWaiverVersion === CURRENT_HEALTH_WAIVER_VERSION &&
          isAcceptanceDateFresh(user.healthAgreedAt, PHYSICAL_SERVICE_HEALTH_WAIVER_MAX_AGE_DAYS),
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
  const existingUser = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isOnboarded: true,
      deletedAt: true,
      acceptedTermsVersion: true,
      acceptedHealthWaiverVersion: true,
      acceptedHealthDataConsentVersion: true,
      termsAgreedAt: true,
      healthAgreedAt: true,
      healthDataConsentedAt: true,
    },
  });

  if (!existingUser || existingUser.deletedAt) throw new Error("USER_NOT_FOUND");

  if (typeof input.firstName === "string") data.firstName = input.firstName.trim().slice(0, 80);
  if (typeof input.lastName === "string") data.lastName = input.lastName.trim().slice(0, 80);

  if (data.firstName !== undefined || data.lastName !== undefined) {
    const firstName = data.firstName ?? existingUser.firstName ?? "";
    const lastName = data.lastName ?? existingUser.lastName ?? "";
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
    if (
      input.hasAgreedToTerms === true &&
      existingUser.acceptedTermsVersion !== CURRENT_TERMS_VERSION
    ) {
      acceptancesToRecord.push(AcceptanceType.terms);
    }

    if (
      input.hasAgreedToHealth === true &&
      (existingUser.acceptedHealthWaiverVersion !== CURRENT_HEALTH_WAIVER_VERSION ||
        !isAcceptanceDateFresh(
          existingUser.healthAgreedAt,
          PHYSICAL_SERVICE_HEALTH_WAIVER_MAX_AGE_DAYS
        ))
    ) {
      acceptancesToRecord.push(AcceptanceType.health_waiver);
    }

    if (
      input.hasConsentedToHealthData === true &&
      existingUser.acceptedHealthDataConsentVersion !== CURRENT_HEALTH_DATA_CONSENT_VERSION
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
  const onboardingJustCompleted = !existingUser.isOnboarded && updated.isOnboarded;

  await recordUserLifecycleEvent({
    eventType: "user_updated",
    userId,
    actorUserId: userId,
    payload: {
      fields: Object.keys(data),
      onboardingCompleted: onboardingJustCompleted,
    },
  }).catch(() => null);

  if (onboardingJustCompleted && updated.email) {
    await sendWelcomeEmail(updated.email, updated.firstName || "there").catch(() => null);
  }

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
      hasAgreedToHealth:
        updated.acceptedHealthWaiverVersion === CURRENT_HEALTH_WAIVER_VERSION &&
        isAcceptanceDateFresh(updated.healthAgreedAt, PHYSICAL_SERVICE_HEALTH_WAIVER_MAX_AGE_DAYS),
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

export async function requestEmailChange(userId: string, nextEmailRaw: string, ip?: string | null) {
  const nextEmail = normalizeEmail(nextEmailRaw);
  if (!nextEmail || !nextEmail.includes("@")) {
    throw new Error("INVALID_EMAIL");
  }

  const [user, existing] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, pendingEmail: true, deletedAt: true },
    }),
    db.user.findUnique({
      where: { email: nextEmail },
      select: { id: true },
    }),
  ]);

  if (!user || user.deletedAt) {
    throw new Error("USER_NOT_FOUND");
  }
  if (user.email === nextEmail) {
    throw new Error("EMAIL_UNCHANGED");
  }
  if (existing && existing.id !== userId) {
    throw new Error("EMAIL_IN_USE");
  }

  await db.user.update({
    where: { id: userId },
    data: { pendingEmail: nextEmail },
  });

  const issued = await issueAuthChallenge({
    email: nextEmail,
    userId,
    purpose: AuthChallengePurpose.email_change,
    ip,
    metadata: {
      currentEmail: user.email,
    },
  });

  if (!issued.ok) {
    throw new Error("EMAIL_CHANGE_COOLDOWN");
  }

  await sendAuthCodeEmail(nextEmail, issued.code, issued.expiryMinutes);

  return {
    pendingEmail: nextEmail,
    expiresAt: issued.expiresAt.toISOString(),
  };
}

export async function confirmEmailChange(
  userId: string,
  nextEmailRaw: string,
  codeRaw: string,
  ip?: string | null
) {
  const nextEmail = normalizeEmail(nextEmailRaw);
  const code = codeRaw.replace(/\D/g, "").slice(0, 6);
  if (!nextEmail || !code) {
    throw new Error("INVALID_EMAIL_CHANGE_CONFIRMATION");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, pendingEmail: true, deletedAt: true },
  });

  if (!user || user.deletedAt) {
    throw new Error("USER_NOT_FOUND");
  }
  if (user.pendingEmail !== nextEmail) {
    throw new Error("EMAIL_CHANGE_MISMATCH");
  }

  const verification = await verifyAuthChallenge({
    email: nextEmail,
    code,
    purposes: [AuthChallengePurpose.email_change],
    ip,
  });

  if (!verification.ok) {
    throw new Error("INVALID_EMAIL_CHANGE_CODE");
  }

  await db.user.update({
    where: { id: userId },
    data: {
      email: nextEmail,
      pendingEmail: null,
      emailVerified: new Date(),
    },
  });

  await recordUserLifecycleEvent({
    eventType: "user_updated",
    userId,
    actorUserId: userId,
    payload: {
      change: "email",
      previousEmail: user.email,
      nextEmail,
    },
  }).catch(() => null);

  return { email: nextEmail };
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
