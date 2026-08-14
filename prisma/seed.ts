import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  AcceptanceType,
  MembershipBillingInterval,
  MembershipPlan,
  MembershipStatus,
  Prisma,
  PrismaClient,
  ReferralLedgerType,
  RetreatBookingStatus,
  RetreatBookingUnit,
  RetreatDepositType,
  RetreatInventoryType,
  RetreatPaymentStatus,
  SmallGroupEnrollmentStatus,
  SmallGroupProgrammeStatus,
  SmallGroupSessionStatus,
  UserRole,
} from "@prisma/client";
import {
  CURRENT_HEALTH_DATA_CONSENT_VERSION,
  CURRENT_HEALTH_WAIVER_VERSION,
  CURRENT_TERMS_VERSION,
} from "../src/data/legal-documents.ts";
import { retreats } from "../src/data/retreat-data.ts";
import { smallGroupTemplates } from "../src/data/small-group-programmes.ts";
import { SUBSCRIPTION_DISCLOSURE_VERSION } from "../src/lib/billing/subscription-disclosure.ts";

function readEnvValue(key: "DIRECT_URL" | "DATABASE_URL"): string | undefined {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return undefined;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 0) continue;
    if (trimmed.slice(0, separatorIndex).trim() !== key) continue;
    return trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
  }

  return undefined;
}

const connectionString =
  readEnvValue("DATABASE_URL") ||
  readEnvValue("DIRECT_URL") ||
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL or DIRECT_URL for local seed script.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const DEFAULT_MEMBER_AUTH_CODE = (process.env.MEMBER_TEST_AUTH_CODE || "123456").trim();
const DEFAULT_MEMBER_AUTH_CODE_EXPIRY = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);

const CURRENT_POLICY_SEEDS = [
  {
    type: AcceptanceType.terms,
    slug: "terms",
    version: CURRENT_TERMS_VERSION,
    label: "Terms & Conditions",
  },
  {
    type: AcceptanceType.health_waiver,
    slug: "health-declaration",
    version: CURRENT_HEALTH_WAIVER_VERSION,
    label: "Health & Liability Waiver",
  },
  {
    type: AcceptanceType.health_data,
    slug: "health-data-consent",
    version: CURRENT_HEALTH_DATA_CONSENT_VERSION,
    label: "Health Data Consent",
  },
  {
    type: AcceptanceType.recording_notice,
    slug: "recording-notice",
    version: "recording-notice.v1",
    label: "Recording Notice",
  },
  {
    type: AcceptanceType.immediate_start,
    slug: "immediate-start",
    version: "immediate-start.v1",
    label: "Immediate Start Acknowledgement",
  },
  {
    type: AcceptanceType.marketing,
    slug: "marketing-consent",
    version: "marketing-consent.v1",
    label: "Marketing Consent",
  },
] as const;

const LEGACY_POLICY_SEEDS = [
  {
    type: AcceptanceType.terms,
    slug: "terms",
    version: "2025-10-01",
    label: "Terms & Conditions",
  },
  {
    type: AcceptanceType.health_waiver,
    slug: "health-declaration",
    version: "2025-10-01",
    label: "Health & Liability Waiver",
  },
  {
    type: AcceptanceType.health_data,
    slug: "health-data-consent",
    version: "2025-10-01",
    label: "Health Data Consent",
  },
] as const;

const LOCAL_SCENARIO_USERS = [
  {
    key: "membership_ready",
    email: "member-monthly@shrutiturner.local",
    firstName: "Maya",
    lastName: "Monthly",
    referralCode: "LOCALMONTHLY",
  },
  {
    key: "membership_active",
    email: "member-active@shrutiturner.local",
    firstName: "Ava",
    lastName: "Active",
    referralCode: "LOCALACTIVE",
  },
  {
    key: "credits_only",
    email: "member-credits@shrutiturner.local",
    firstName: "Cara",
    lastName: "Credits",
    referralCode: "LOCALCREDITS",
  },
  {
    key: "retreat_balance_due",
    email: "member-retreat@shrutiturner.local",
    firstName: "Riya",
    lastName: "Retreat",
    referralCode: "LOCALRETREAT",
  },
  {
    key: "legal_refresh",
    email: "member-legal-refresh@shrutiturner.local",
    firstName: "Leah",
    lastName: "Refresh",
    referralCode: "LOCALLEGAL",
  },
] as const;

function datePlus(days: number) {
  return new Date(Date.now() + days * 86400000);
}

function atUtcTime(date: Date, hours: number, minutes = 0) {
  const value = new Date(date);
  value.setUTCHours(hours, minutes, 0, 0);
  return value;
}

function toSeedKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function subtractDays(date: Date, days: number) {
  return new Date(date.getTime() - days * 86400000);
}

function seedDateTime(dateValue: string, fallbackTime: string) {
  return new Date(dateValue.includes("T") ? dateValue : `${dateValue}T${fallbackTime}.000Z`);
}

function calculateSeedDepositPence(input: {
  totalPence: number;
  depositType: "percentage" | "fixed_amount" | "full_payment";
  depositPercentageBasisPoints?: number;
  fixedDepositAmountPence?: number;
}) {
  if (input.depositType === "full_payment") return input.totalPence;
  if (input.depositType === "fixed_amount") {
    return Math.min(input.fixedDepositAmountPence ?? input.totalPence, input.totalPence);
  }
  return Math.round((input.totalPence * (input.depositPercentageBasisPoints ?? 0)) / 10000);
}

function runSeedBillingDataset() {
  execFileSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--experimental-specifier-resolution=node",
      resolve(process.cwd(), "prisma/seed-billing.ts"),
    ],
    { stdio: "inherit" }
  );
}

function summaryUserAcceptanceUpdate(
  type: AcceptanceType,
  currentVersion: string,
  acceptedAt: Date
): Prisma.UserUpdateInput {
  if (type === AcceptanceType.terms) {
    return {
      hasAgreedToTerms: true,
      acceptedTermsVersion: currentVersion,
      termsAgreedAt: acceptedAt,
    };
  }

  if (type === AcceptanceType.health_waiver) {
    return {
      hasAgreedToHealth: true,
      acceptedHealthWaiverVersion: currentVersion,
      healthAgreedAt: acceptedAt,
    };
  }

  if (type === AcceptanceType.health_data) {
    return {
      hasConsentedToHealthData: true,
      acceptedHealthDataConsentVersion: currentVersion,
      healthDataConsentedAt: acceptedAt,
    };
  }

  return {};
}

async function ensurePolicyVersions() {
  for (const seed of [...LEGACY_POLICY_SEEDS, ...CURRENT_POLICY_SEEDS]) {
    await prisma.policyDocumentVersion.upsert({
      where: {
        type_version: {
          type: seed.type,
          version: seed.version,
        },
      },
      update: {
        slug: seed.slug,
        label: seed.label,
        contentSource: "seed",
        publishedAt:
          seed.version === "2025-10-01" ? new Date("2025-10-01T09:00:00.000Z") : new Date(),
        isCurrent: CURRENT_POLICY_SEEDS.some(
          (current) => current.type === seed.type && current.version === seed.version
        ),
      },
      create: {
        type: seed.type,
        slug: seed.slug,
        version: seed.version,
        label: seed.label,
        contentSource: "seed",
        publishedAt:
          seed.version === "2025-10-01" ? new Date("2025-10-01T09:00:00.000Z") : new Date(),
        isCurrent: CURRENT_POLICY_SEEDS.some(
          (current) => current.type === seed.type && current.version === seed.version
        ),
      },
    });
  }

  for (const seed of CURRENT_POLICY_SEEDS) {
    await prisma.policyDocumentVersion.updateMany({
      where: {
        type: seed.type,
        NOT: { version: seed.version },
      },
      data: {
        isCurrent: false,
      },
    });
  }

  const policies = await prisma.policyDocumentVersion.findMany({
    where: {
      type: { in: CURRENT_POLICY_SEEDS.map((seed) => seed.type) },
      isCurrent: true,
    },
  });

  return new Map(policies.map((policy) => [policy.type, policy]));
}

async function upsertUser(input: {
  email: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  referralCode?: string;
  authCode?: string | null;
  authCodeExpiry?: Date | null;
  isOnboarded?: boolean;
  hasHealthProfile?: boolean;
  heardAboutSource?: string | null;
  heardAboutDetail?: string | null;
  isCoachingClient?: boolean;
}) {
  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: {
      firstName: input.firstName,
      lastName: input.lastName,
      name: `${input.firstName} ${input.lastName}`.trim(),
      role: input.role || UserRole.student,
      referralCode: input.referralCode || undefined,
      timezone: "Europe/London",
      dateFormat: "DD/MM/YYYY",
      isOnboarded: input.isOnboarded ?? true,
      heardAboutSource: input.heardAboutSource ?? "seed",
      heardAboutDetail: input.heardAboutDetail ?? "Local bootstrap seed",
      isCoachingClient: input.isCoachingClient ?? false,
      authCode: input.authCode ?? undefined,
      authCodeExpiry: input.authCodeExpiry ?? undefined,
      emailVerified: new Date(),
    },
    create: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      name: `${input.firstName} ${input.lastName}`.trim(),
      role: input.role || UserRole.student,
      referralCode: input.referralCode || undefined,
      timezone: "Europe/London",
      dateFormat: "DD/MM/YYYY",
      isOnboarded: input.isOnboarded ?? true,
      heardAboutSource: input.heardAboutSource ?? "seed",
      heardAboutDetail: input.heardAboutDetail ?? "Local bootstrap seed",
      isCoachingClient: input.isCoachingClient ?? false,
      authCode: input.authCode ?? undefined,
      authCodeExpiry: input.authCodeExpiry ?? undefined,
      emailVerified: new Date(),
    },
  });

  await prisma.userNotificationPreference.upsert({
    where: { userId: user.id },
    update: {
      classReminders: true,
      scheduleUpdates: true,
      programAnnouncements: true,
      marketingEmails: false,
    },
    create: {
      userId: user.id,
      classReminders: true,
      scheduleUpdates: true,
      programAnnouncements: true,
      marketingEmails: false,
    },
  });

  if (input.hasHealthProfile !== false) {
    await prisma.healthProfile.upsert({
      where: { userId: user.id },
      update: {
        declarationStatus: "context_declared",
        tracksFlareCheckIns: true,
        additionalNotes: "Seeded profile for local booking flows.",
        lastConfirmedAt: datePlus(-2),
        lastUpdatedAt: datePlus(-2),
      },
      create: {
        userId: user.id,
        declarationStatus: "context_declared",
        tracksFlareCheckIns: true,
        additionalNotes: "Seeded profile for local booking flows.",
        lastConfirmedAt: datePlus(-2),
        lastUpdatedAt: datePlus(-2),
      },
    });
  }

  return user;
}

async function recordSeedAcceptance(input: {
  userId: string;
  userKey: string;
  type: AcceptanceType;
  version: string;
  policyVersionId: string;
  surface: string;
  acceptedAt: Date;
  metadataJson?: Prisma.InputJsonValue;
}) {
  await prisma.acceptanceEvent.upsert({
    where: {
      id: `seed_acceptance_${input.userKey}_${input.type}`,
    },
    update: {
      userId: input.userId,
      actorUserId: input.userId,
      type: input.type,
      version: input.version,
      policyVersionId: input.policyVersionId,
      acceptanceSurface: input.surface,
      acceptedAt: input.acceptedAt,
      metadataJson: input.metadataJson,
    },
    create: {
      id: `seed_acceptance_${input.userKey}_${input.type}`,
      userId: input.userId,
      actorUserId: input.userId,
      type: input.type,
      version: input.version,
      policyVersionId: input.policyVersionId,
      acceptanceSurface: input.surface,
      acceptedAt: input.acceptedAt,
      metadataJson: input.metadataJson,
    },
  });

  const userUpdate = summaryUserAcceptanceUpdate(input.type, input.version, input.acceptedAt);
  if (Object.keys(userUpdate).length > 0) {
    await prisma.user.update({
      where: { id: input.userId },
      data: userUpdate,
    });
  }
}

async function seedCurrentAcceptancesForUser(
  user: { id: string; email: string },
  policies: Map<AcceptanceType, { id: string; version: string }>,
  options?: {
    includeHealthData?: boolean;
    includeMarketing?: boolean;
    includeRecordingNotice?: boolean;
    surface?: string;
  }
) {
  const userKey = toSeedKey(user.email);
  const acceptedAt = datePlus(-7);
  const surface = options?.surface || "local_seed";

  const requiredTypes = [
    AcceptanceType.terms,
    AcceptanceType.health_waiver,
    ...(options?.includeHealthData === false ? [] : [AcceptanceType.health_data]),
    ...(options?.includeRecordingNotice ? [AcceptanceType.recording_notice] : []),
    ...(options?.includeMarketing ? [AcceptanceType.marketing] : []),
  ];

  for (const type of requiredTypes) {
    const policy = policies.get(type);
    if (!policy) continue;
    await recordSeedAcceptance({
      userId: user.id,
      userKey,
      type,
      version: policy.version,
      policyVersionId: policy.id,
      surface,
      acceptedAt,
    });
  }
}

async function seedLegacyAcceptanceUser(
  user: { id: string; email: string },
  legacyPolicies: Map<AcceptanceType, { id: string; version: string }>
) {
  const acceptedAt = datePlus(-120);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      hasAgreedToTerms: true,
      acceptedTermsVersion: LEGACY_POLICY_SEEDS[0].version,
      termsAgreedAt: acceptedAt,
      hasAgreedToHealth: true,
      acceptedHealthWaiverVersion: LEGACY_POLICY_SEEDS[1].version,
      healthAgreedAt: acceptedAt,
      hasConsentedToHealthData: true,
      acceptedHealthDataConsentVersion: LEGACY_POLICY_SEEDS[2].version,
      healthDataConsentedAt: acceptedAt,
    },
  });

  for (const type of [
    AcceptanceType.terms,
    AcceptanceType.health_waiver,
    AcceptanceType.health_data,
  ]) {
    const policy = legacyPolicies.get(type);
    if (!policy) continue;
    await prisma.acceptanceEvent.upsert({
      where: {
        id: `seed_acceptance_${toSeedKey(user.email)}_${type}`,
      },
      update: {
        userId: user.id,
        actorUserId: user.id,
        type,
        version: policy.version,
        policyVersionId: policy.id,
        acceptanceSurface: "local_seed_legacy",
        acceptedAt,
      },
      create: {
        id: `seed_acceptance_${toSeedKey(user.email)}_${type}`,
        userId: user.id,
        actorUserId: user.id,
        type,
        version: policy.version,
        policyVersionId: policy.id,
        acceptanceSurface: "local_seed_legacy",
        acceptedAt,
      },
    });
  }
}

async function seedScenarioUsers(
  policies: Map<AcceptanceType, { id: string; version: string }>,
  legacyPolicies: Map<AcceptanceType, { id: string; version: string }>
) {
  const scenarioUsers = new Map<string, Awaited<ReturnType<typeof upsertUser>>>();

  for (const scenario of LOCAL_SCENARIO_USERS) {
    const user = await upsertUser({
      email: scenario.email,
      firstName: scenario.firstName,
      lastName: scenario.lastName,
      referralCode: scenario.referralCode,
      authCode: DEFAULT_MEMBER_AUTH_CODE,
      authCodeExpiry: DEFAULT_MEMBER_AUTH_CODE_EXPIRY,
    });
    scenarioUsers.set(scenario.key, user);
  }

  const monthlyReadyUser = scenarioUsers.get("membership_ready");
  const activeMemberUser = scenarioUsers.get("membership_active");
  const creditsUser = scenarioUsers.get("credits_only");
  const retreatUser = scenarioUsers.get("retreat_balance_due");
  const staleLegalUser = scenarioUsers.get("legal_refresh");

  if (!monthlyReadyUser || !activeMemberUser || !creditsUser || !retreatUser || !staleLegalUser) {
    throw new Error("Failed to create deterministic local scenario users.");
  }

  await seedCurrentAcceptancesForUser(monthlyReadyUser, policies, {
    includeHealthData: true,
    includeMarketing: true,
    surface: "seed_membership_checkout",
  });
  await seedCurrentAcceptancesForUser(activeMemberUser, policies, {
    includeHealthData: true,
    includeMarketing: true,
    surface: "seed_membership_active",
  });
  await seedCurrentAcceptancesForUser(creditsUser, policies, {
    includeHealthData: true,
    surface: "seed_credits_only",
  });
  await seedCurrentAcceptancesForUser(retreatUser, policies, {
    includeHealthData: true,
    includeRecordingNotice: true,
    surface: "seed_retreat_checkout",
  });
  await seedLegacyAcceptanceUser(staleLegalUser, legacyPolicies);

  await prisma.membershipSubscription.upsert({
    where: { id: "seed_local_membership_active" },
    update: {
      userId: activeMemberUser.id,
      plan: MembershipPlan.movewell,
      billingInterval: MembershipBillingInterval.monthly,
      status: MembershipStatus.active,
      pricePence: 3500,
      classesPerWeek: 99,
      classesUsedThisWeek: 2,
      startsAt: datePlus(-30),
      renewsAt: datePlus(14),
      disclosureVersion: SUBSCRIPTION_DISCLOSURE_VERSION,
      disclosureAcceptedAt: datePlus(-30),
      trialEndsAt: datePlus(-16),
      initialCoolingOffEndsAt: datePlus(-16),
    },
    create: {
      id: "seed_local_membership_active",
      userId: activeMemberUser.id,
      plan: MembershipPlan.movewell,
      billingInterval: MembershipBillingInterval.monthly,
      status: MembershipStatus.active,
      pricePence: 3500,
      currency: "GBP",
      classesPerWeek: 99,
      classesUsedThisWeek: 2,
      startsAt: datePlus(-30),
      renewsAt: datePlus(14),
      disclosureVersion: SUBSCRIPTION_DISCLOSURE_VERSION,
      disclosureAcceptedAt: datePlus(-30),
      trialEndsAt: datePlus(-16),
      initialCoolingOffEndsAt: datePlus(-16),
    },
  });

  await prisma.creditLedgerEntry.upsert({
    where: { id: "seed_local_credit_bundle" },
    update: {
      userId: creditsUser.id,
      amount: 10,
      type: "purchase",
      description: "Local seed credit bundle",
      sourceRef: "seed:local:credit-bundle",
      expiresAt: datePlus(60),
    },
    create: {
      id: "seed_local_credit_bundle",
      userId: creditsUser.id,
      amount: 10,
      type: "purchase",
      description: "Local seed credit bundle",
      sourceRef: "seed:local:credit-bundle",
      expiresAt: datePlus(60),
    },
  });

  await prisma.referralLedgerEntry.upsert({
    where: { id: "seed_local_referral_balance" },
    update: {
      userId: monthlyReadyUser.id,
      amountPence: 1200,
      currency: "GBP",
      type: ReferralLedgerType.reward,
      description: "Local seed referral balance",
    },
    create: {
      id: "seed_local_referral_balance",
      userId: monthlyReadyUser.id,
      amountPence: 1200,
      currency: "GBP",
      type: ReferralLedgerType.reward,
      description: "Local seed referral balance",
    },
  });

  return {
    monthlyReadyUser,
    activeMemberUser,
    creditsUser,
    retreatUser,
    staleLegalUser,
  };
}

async function seedAdminUsers() {
  const adminEmails = (process.env.ADMIN_EMAILS || "shruti@shrutiturner.co.uk")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  for (const email of adminEmails) {
    const isPrimaryInstructor = email === "shruti@shrutiturner.co.uk";
    await upsertUser({
      email,
      firstName: isPrimaryInstructor ? "Shruti" : "Admin",
      lastName: isPrimaryInstructor ? "Turner" : "User",
      role: UserRole.admin,
      referralCode: undefined,
      authCode: isPrimaryInstructor ? DEFAULT_MEMBER_AUTH_CODE : null,
      authCodeExpiry: isPrimaryInstructor ? DEFAULT_MEMBER_AUTH_CODE_EXPIRY : null,
      hasHealthProfile: false,
      isOnboarded: true,
    });
  }

  await upsertUser({
    email: (process.env.ADMIN_TEST_EMAIL || "admin-test@shrutiturner.local").trim().toLowerCase(),
    firstName: "Admin",
    lastName: "Test",
    role: UserRole.admin,
    authCode: (process.env.ADMIN_TEST_AUTH_CODE || DEFAULT_MEMBER_AUTH_CODE).trim(),
    authCodeExpiry: DEFAULT_MEMBER_AUTH_CODE_EXPIRY,
    hasHealthProfile: false,
    isOnboarded: true,
  });
}

async function seedCurrentAcceptancesForLocalUsers(
  policies: Map<AcceptanceType, { id: string; version: string }>
) {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: "@example.com" } },
        { email: { endsWith: "@shrutiturner.local" } },
        { email: { equals: "shruti@shrutiturner.co.uk" } },
      ],
    },
    select: {
      id: true,
      email: true,
    },
  });

  for (const user of users) {
    if (user.email === "member-legal-refresh@shrutiturner.local") continue;
    await seedCurrentAcceptancesForUser(user, policies, {
      includeHealthData: true,
      includeMarketing: user.email.endsWith("@shrutiturner.local"),
      surface: "local_seed_bootstrap",
    });
  }
}

async function seedRetreatInventory(retreatUserId: string, instructorUserId?: string | null) {
  for (const retreat of retreats) {
    for (const date of retreat.dates) {
      const retreatDateId = `seed_retreat_date_${retreat.slug}_${date.id}`;
      const startsAt = seedDateTime(date.startDateTime || date.startDate, "15:00:00");
      const endsAt = seedDateTime(date.endDateTime || date.endDate, "10:00:00");
      const balanceDueAt = date.balanceDueDaysBeforeStart
        ? subtractDays(startsAt, date.balanceDueDaysBeforeStart)
        : null;
      const firstRate =
        date.roomOptions[0]?.ratePlans[0]?.totalPricePence ?? retreat.normalPrice * 100;
      const firstDeposit = calculateSeedDepositPence({
        totalPence: firstRate,
        depositType: date.depositType,
        depositPercentageBasisPoints: date.depositPercentageBasisPoints,
        fixedDepositAmountPence: date.fixedDepositAmountPence,
      });
      const retreatDate = await prisma.retreatDate.upsert({
        where: { externalDateId: date.id },
        update: {
          retreatSlug: retreat.slug,
          retreatTitleSnapshot: retreat.title,
          retreatLocationSnapshot: retreat.location,
          retreatType: date.retreatType,
          timezone: "Europe/London",
          startsAt,
          endsAt,
          capacity: date.totalSpaces,
          status: date.availableSpaces > 0 ? "open" : "sold_out",
          currency: retreat.currency,
          pricePence: firstRate,
          depositAmountPence: firstDeposit,
          balanceDueAt,
          isRecorded: date.isRecorded === true,
          replayAccessDurationDays: date.replayAccessDurationDays ?? null,
          payInFullDiscountEnabled: date.payInFullDiscountEnabled ?? true,
          paymentPlanSnapshotJson: {
            depositType: date.depositType,
            depositPercentageBasisPoints: date.depositPercentageBasisPoints ?? null,
            fixedDepositAmountPence: date.fixedDepositAmountPence ?? null,
            balanceDueDaysBeforeStart: date.balanceDueDaysBeforeStart ?? null,
          },
        },
        create: {
          id: retreatDateId,
          externalDateId: date.id,
          retreatSlug: retreat.slug,
          retreatTitleSnapshot: retreat.title,
          retreatLocationSnapshot: retreat.location,
          retreatType: date.retreatType,
          timezone: "Europe/London",
          startsAt,
          endsAt,
          capacity: date.totalSpaces,
          status: date.availableSpaces > 0 ? "open" : "sold_out",
          currency: retreat.currency,
          pricePence: firstRate,
          depositAmountPence: firstDeposit,
          balanceDueAt,
          isRecorded: date.isRecorded === true,
          replayAccessDurationDays: date.replayAccessDurationDays ?? null,
          payInFullDiscountEnabled: date.payInFullDiscountEnabled ?? true,
          paymentPlanSnapshotJson: {
            depositType: date.depositType,
            depositPercentageBasisPoints: date.depositPercentageBasisPoints ?? null,
            fixedDepositAmountPence: date.fixedDepositAmountPence ?? null,
            balanceDueDaysBeforeStart: date.balanceDueDaysBeforeStart ?? null,
          },
        },
      });

      for (const roomOption of date.roomOptions) {
        const authoritativePricePence =
          roomOption.ratePlans[0]?.totalPricePence ?? roomOption.normalPricePence;
        const authoritativeDepositPence = calculateSeedDepositPence({
          totalPence: authoritativePricePence,
          depositType: date.depositType,
          depositPercentageBasisPoints: date.depositPercentageBasisPoints,
          fixedDepositAmountPence: date.fixedDepositAmountPence,
        });
        const inventoryPool = await prisma.retreatInventoryPool.upsert({
          where: { id: `seed_retreat_inventory_${retreat.slug}_${date.id}_${roomOption.id}` },
          update: {
            retreatDateId: retreatDate.id,
            inventoryType: roomOption.inventoryType as RetreatInventoryType,
            name: roomOption.label,
            totalQuantity: roomOption.inventoryQuantity,
            active: true,
          },
          create: {
            id: `seed_retreat_inventory_${retreat.slug}_${date.id}_${roomOption.id}`,
            retreatDateId: retreatDate.id,
            inventoryType: roomOption.inventoryType as RetreatInventoryType,
            name: roomOption.label,
            totalQuantity: roomOption.inventoryQuantity,
            active: true,
          },
        });

        const dbRoomOption = await prisma.retreatRoomOption.upsert({
          where: {
            retreatDateId_externalRoomOptionId: {
              retreatDateId: retreatDate.id,
              externalRoomOptionId: roomOption.id,
            },
          },
          update: {
            inventoryPoolId: inventoryPool.id,
            inventoryUnitsPerBooking: roomOption.inventoryUnitsPerBooking ?? 1,
            label: roomOption.label,
            description: roomOption.description,
            roomType: roomOption.type,
            bookingUnit: roomOption.bookingUnit as RetreatBookingUnit,
            guestsIncluded: roomOption.guestsIncluded,
            guestCountPerUnit: roomOption.guestCountPerUnit ?? null,
            physicalRoomCount: roomOption.physicalRoomCount ?? null,
            bedsPerPhysicalRoom: roomOption.bedsPerPhysicalRoom ?? null,
            allowedGuestCountsJson: roomOption.allowedGuestCounts ?? Prisma.JsonNull,
            capacity: roomOption.capacity,
            availableSpots: roomOption.availableSpots,
            pricePence: authoritativePricePence,
            pricePerPersonPence: roomOption.pricePerPersonPence ?? null,
            roomCount:
              roomOption.bookingUnit === "whole_room"
                ? roomOption.inventoryQuantity
                : (roomOption.physicalRoomCount ?? 0),
            depositAmountPence: authoritativeDepositPence,
            isWaitlistOnly: roomOption.isWaitlistOnly === true,
            displayOrder: roomOption.displayOrder ?? 0,
            active: true,
          },
          create: {
            id: `seed_retreat_room_${retreat.slug}_${roomOption.id}`,
            retreatDateId: retreatDate.id,
            inventoryPoolId: inventoryPool.id,
            inventoryUnitsPerBooking: roomOption.inventoryUnitsPerBooking ?? 1,
            externalRoomOptionId: roomOption.id,
            label: roomOption.label,
            description: roomOption.description,
            roomType: roomOption.type,
            bookingUnit: roomOption.bookingUnit as RetreatBookingUnit,
            guestsIncluded: roomOption.guestsIncluded,
            guestCountPerUnit: roomOption.guestCountPerUnit ?? null,
            physicalRoomCount: roomOption.physicalRoomCount ?? null,
            bedsPerPhysicalRoom: roomOption.bedsPerPhysicalRoom ?? null,
            allowedGuestCountsJson: roomOption.allowedGuestCounts ?? Prisma.JsonNull,
            capacity: roomOption.capacity,
            availableSpots: roomOption.availableSpots,
            pricePence: authoritativePricePence,
            pricePerPersonPence: roomOption.pricePerPersonPence ?? null,
            roomCount:
              roomOption.bookingUnit === "whole_room"
                ? roomOption.inventoryQuantity
                : (roomOption.physicalRoomCount ?? 0),
            depositAmountPence: authoritativeDepositPence,
            isWaitlistOnly: roomOption.isWaitlistOnly === true,
            displayOrder: roomOption.displayOrder ?? 0,
            active: true,
          },
        });

        for (const ratePlan of roomOption.ratePlans) {
          await prisma.retreatRatePlan.upsert({
            where: {
              roomOptionId_guestCount: {
                roomOptionId: dbRoomOption.id,
                guestCount: ratePlan.guestCount,
              },
            },
            update: {
              totalPricePence: ratePlan.totalPricePence,
              earlyBirdPricePence: ratePlan.earlyBirdPricePence ?? null,
              earlyBirdEndsAt: ratePlan.earlyBirdEndsAt ? new Date(ratePlan.earlyBirdEndsAt) : null,
              currency: retreat.currency,
              active: true,
            },
            create: {
              id: `seed_retreat_rate_${retreat.slug}_${date.id}_${roomOption.id}_${ratePlan.guestCount}`,
              roomOptionId: dbRoomOption.id,
              guestCount: ratePlan.guestCount,
              totalPricePence: ratePlan.totalPricePence,
              earlyBirdPricePence: ratePlan.earlyBirdPricePence ?? null,
              earlyBirdEndsAt: ratePlan.earlyBirdEndsAt ? new Date(ratePlan.earlyBirdEndsAt) : null,
              currency: retreat.currency,
              active: true,
            },
          });
        }

        const roomUnitCount =
          roomOption.bookingUnit === "whole_room"
            ? roomOption.inventoryQuantity
            : (roomOption.physicalRoomCount ?? 0);
        for (let index = 1; index <= roomUnitCount; index += 1) {
          await prisma.retreatRoomUnit.upsert({
            where: {
              retreatDateId_roomOptionId_label: {
                retreatDateId: retreatDate.id,
                roomOptionId: dbRoomOption.id,
                label: `${roomOption.label} ${index}`,
              },
            },
            update: {
              inventoryPoolId: inventoryPool.id,
              status: "available",
              capacityUnits:
                roomOption.bookingUnit === "bed_space"
                  ? Math.max(roomOption.bedsPerPhysicalRoom ?? 1, 1)
                  : 1,
            },
            create: {
              id: `seed_retreat_room_unit_${retreat.slug}_${date.id}_${roomOption.id}_${index}`,
              retreatDateId: retreatDate.id,
              roomOptionId: dbRoomOption.id,
              inventoryPoolId: inventoryPool.id,
              label: `${roomOption.label} ${index}`,
              capacityUnits:
                roomOption.bookingUnit === "bed_space"
                  ? Math.max(roomOption.bedsPerPhysicalRoom ?? 1, 1)
                  : 1,
              status: "available",
            },
          });
        }
      }

      await prisma.retreatDepositRule.upsert({
        where: { id: `seed_retreat_deposit_rule_${retreat.slug}_${date.id}` },
        update: {
          retreatDateId: retreatDate.id,
          depositType: date.depositType as RetreatDepositType,
          depositPercentageBasisPoints: date.depositPercentageBasisPoints ?? null,
          fixedDepositAmountPence: date.fixedDepositAmountPence ?? null,
          balanceDueAt,
          balanceDueDaysBeforeStart: date.balanceDueDaysBeforeStart ?? null,
          active: true,
        },
        create: {
          id: `seed_retreat_deposit_rule_${retreat.slug}_${date.id}`,
          retreatDateId: retreatDate.id,
          depositType: date.depositType as RetreatDepositType,
          depositPercentageBasisPoints: date.depositPercentageBasisPoints ?? null,
          fixedDepositAmountPence: date.fixedDepositAmountPence ?? null,
          balanceDueAt,
          balanceDueDaysBeforeStart: date.balanceDueDaysBeforeStart ?? null,
          active: true,
        },
      });

      if (instructorUserId) {
        await prisma.retreatDateInstructorAssignment.upsert({
          where: { id: `seed_retreat_assignment_${retreat.slug}_${date.id}` },
          update: {
            retreatDateId: retreatDate.id,
            userId: instructorUserId,
          },
          create: {
            id: `seed_retreat_assignment_${retreat.slug}_${date.id}`,
            retreatDateId: retreatDate.id,
            userId: instructorUserId,
          },
        });
      }
    }
  }

  const seedRetreatDate = await prisma.retreatDate.findUniqueOrThrow({
    where: { externalDateId: "the-middle-ground-2026-10-04" },
    include: { roomOptions: true },
  });
  const roomOption =
    seedRetreatDate.roomOptions.find(
      (item) => item.externalRoomOptionId === "live-workshop-ticket"
    ) || seedRetreatDate.roomOptions[0];
  if (!roomOption) {
    throw new Error("Seed retreat room option missing for The Middle Ground.");
  }

  const depositAmountPence = Math.min(
    roomOption.depositAmountPence || 30000,
    roomOption.pricePence
  );
  const balanceAmountPence = Math.max(0, roomOption.pricePence - depositAmountPence);

  await prisma.retreatBooking.upsert({
    where: { id: "seed_retreat_booking_balance_due" },
    update: {
      retreatDateId: seedRetreatDate.id,
      roomOptionId: roomOption.id,
      purchaserUserId: retreatUserId,
      attendeeUserId: retreatUserId,
      purchaserFirstName: "Riya",
      purchaserLastName: "Retreat",
      purchaserEmail: "member-retreat@shrutiturner.local",
      attendeeFirstName: "Riya",
      attendeeLastName: "Retreat",
      attendeeEmail: "member-retreat@shrutiturner.local",
      phone: "+44 7700 900123",
      emergencyContactName: "Local Seed Contact",
      emergencyContactPhone: "+44 7700 900124",
      dietaryRequirements: "Vegetarian",
      medicalConditions: "Hypermobility and fatigue management",
      mobilityNeeds: "Pacing-friendly schedule and step-light access",
      acceptedTermsVersion: CURRENT_TERMS_VERSION,
      acceptedHealthWaiverVersion: CURRENT_HEALTH_WAIVER_VERSION,
      acceptedHealthDataVersion: CURRENT_HEALTH_DATA_CONSENT_VERSION,
      totalPricePence: roomOption.pricePence,
      depositAmountPence,
      balanceAmountPence,
      depositPaidPence: depositAmountPence,
      balancePaidPence: 0,
      paymentStatus:
        balanceAmountPence > 0
          ? RetreatPaymentStatus.partially_paid
          : RetreatPaymentStatus.paid_in_full,
      bookingStatus:
        balanceAmountPence > 0
          ? RetreatBookingStatus.balance_due
          : RetreatBookingStatus.paid_in_full,
      balancePaymentUrlToken: "seed-balance-due-token",
      balanceDueAt: seedRetreatDate.balanceDueAt,
      depositPaidAt: datePlus(-12),
      bookedAt: datePlus(-20),
      complianceSnapshotJson: {
        versions: {
          terms: CURRENT_TERMS_VERSION,
          healthWaiver: CURRENT_HEALTH_WAIVER_VERSION,
          healthData: CURRENT_HEALTH_DATA_CONSENT_VERSION,
        },
      },
    },
    create: {
      id: "seed_retreat_booking_balance_due",
      retreatDateId: seedRetreatDate.id,
      roomOptionId: roomOption.id,
      purchaserUserId: retreatUserId,
      attendeeUserId: retreatUserId,
      purchaserFirstName: "Riya",
      purchaserLastName: "Retreat",
      purchaserEmail: "member-retreat@shrutiturner.local",
      attendeeFirstName: "Riya",
      attendeeLastName: "Retreat",
      attendeeEmail: "member-retreat@shrutiturner.local",
      phone: "+44 7700 900123",
      emergencyContactName: "Local Seed Contact",
      emergencyContactPhone: "+44 7700 900124",
      dietaryRequirements: "Vegetarian",
      medicalConditions: "Hypermobility and fatigue management",
      mobilityNeeds: "Pacing-friendly schedule and step-light access",
      acceptedTermsVersion: CURRENT_TERMS_VERSION,
      acceptedHealthWaiverVersion: CURRENT_HEALTH_WAIVER_VERSION,
      acceptedHealthDataVersion: CURRENT_HEALTH_DATA_CONSENT_VERSION,
      totalPricePence: roomOption.pricePence,
      depositAmountPence,
      balanceAmountPence,
      depositPaidPence: depositAmountPence,
      balancePaidPence: 0,
      paymentStatus:
        balanceAmountPence > 0
          ? RetreatPaymentStatus.partially_paid
          : RetreatPaymentStatus.paid_in_full,
      bookingStatus:
        balanceAmountPence > 0
          ? RetreatBookingStatus.balance_due
          : RetreatBookingStatus.paid_in_full,
      balancePaymentUrlToken: "seed-balance-due-token",
      balanceDueAt: seedRetreatDate.balanceDueAt,
      depositPaidAt: datePlus(-12),
      bookedAt: datePlus(-20),
      complianceSnapshotJson: {
        versions: {
          terms: CURRENT_TERMS_VERSION,
          healthWaiver: CURRENT_HEALTH_WAIVER_VERSION,
          healthData: CURRENT_HEALTH_DATA_CONSENT_VERSION,
        },
      },
    },
  });
}

async function seedSmallGroupProgramme(userId: string, instructorUserId?: string | null) {
  const template = smallGroupTemplates.find((item) => item.slug === "foundations-to-confidence");
  if (!template) return;

  const runSlug = "foundations-to-confidence-local-may-2026";
  const startDate = new Date("2026-05-12T18:00:00.000Z");
  const sessionStartsAt = Array.from({ length: 6 }, (_, index) =>
    atUtcTime(datePlus(7 + index * 7), 18, 30)
  );

  const programme = await prisma.smallGroupProgramme.upsert({
    where: { runSlug },
    update: {
      slug: runSlug,
      templateSlug: template.slug,
      templateContentfulEntryId: template.id,
      title: template.title,
      subtitle: template.subtitle ?? null,
      shortDescription: template.shortSummary,
      description: template.fullDescription,
      longDescription: template.longDescription,
      durationLabel: template.durationLabel,
      durationWeeks: template.durationWeeks ?? 6,
      cohortSize: template.cohortSize,
      startDate,
      endDate: sessionStartsAt[sessionStartsAt.length - 1],
      scheduleLabel: "Tuesdays 18:30",
      pricePence: template.defaultPricePence ?? 18000,
      sessionsPerWeek: 1,
      totalSessions: sessionStartsAt.length,
      status: SmallGroupProgrammeStatus.open,
      ctaLabel: "Reserve your place",
      ctaHref: `/classes/small-groups/${template.slug}?run=${runSlug}`,
      featuredBadge: "Seeded live run",
      whoItsForJson: template.whoItsFor as unknown as Prisma.JsonArray,
      equipmentJson: template.equipment as unknown as Prisma.JsonArray,
      inclusionsJson: template.inclusions as unknown as Prisma.JsonArray,
      weekByWeekJson: template.weekByWeek as unknown as Prisma.JsonArray,
      contentfulEntryId: runSlug,
    },
    create: {
      slug: runSlug,
      runSlug,
      templateSlug: template.slug,
      templateContentfulEntryId: template.id,
      title: template.title,
      subtitle: template.subtitle ?? null,
      shortDescription: template.shortSummary,
      description: template.fullDescription,
      longDescription: template.longDescription,
      durationLabel: template.durationLabel,
      durationWeeks: template.durationWeeks ?? 6,
      cohortSize: template.cohortSize,
      startDate,
      endDate: sessionStartsAt[sessionStartsAt.length - 1],
      scheduleLabel: "Tuesdays 18:30",
      pricePence: template.defaultPricePence ?? 18000,
      sessionsPerWeek: 1,
      totalSessions: sessionStartsAt.length,
      status: SmallGroupProgrammeStatus.open,
      ctaLabel: "Reserve your place",
      ctaHref: `/classes/small-groups/${template.slug}?run=${runSlug}`,
      featuredBadge: "Seeded live run",
      whoItsForJson: template.whoItsFor as unknown as Prisma.JsonArray,
      equipmentJson: template.equipment as unknown as Prisma.JsonArray,
      inclusionsJson: template.inclusions as unknown as Prisma.JsonArray,
      weekByWeekJson: template.weekByWeek as unknown as Prisma.JsonArray,
      contentfulEntryId: runSlug,
    },
  });

  await prisma.smallGroupProgrammeSession.deleteMany({
    where: { programmeId: programme.id },
  });

  await prisma.smallGroupProgrammeSession.createMany({
    data: sessionStartsAt.map((startsAt, index) => ({
      id: `seed_small_group_session_${index + 1}`,
      programmeId: programme.id,
      instructorUserId: instructorUserId || undefined,
      title: template.weekByWeek?.[index]?.title || `Week ${index + 1}`,
      startsAt,
      endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
      sequenceNumber: index + 1,
      status: SmallGroupSessionStatus.scheduled,
    })),
  });

  if (instructorUserId) {
    await prisma.smallGroupProgrammeInstructorAssignment.upsert({
      where: { id: "seed_small_group_assignment" },
      update: {
        programmeId: programme.id,
        userId: instructorUserId,
      },
      create: {
        id: "seed_small_group_assignment",
        programmeId: programme.id,
        userId: instructorUserId,
      },
    });
  }

  await prisma.smallGroupProgrammeEnrollment.upsert({
    where: { id: "seed_small_group_enrollment" },
    update: {
      programmeId: programme.id,
      userId,
      attendeeName: "Maya Monthly",
      attendeeEmail: "member-monthly@shrutiturner.local",
      sessionsAttended: 0,
      progressSummary: "Seeded open programme enrolment for local QA.",
      status: SmallGroupEnrollmentStatus.active,
      pricePaidPence: template.defaultPricePence ?? 18000,
      paymentWindowExpiresAt: null,
      complianceSnapshotJson: {
        versions: {
          terms: CURRENT_TERMS_VERSION,
          healthWaiver: CURRENT_HEALTH_WAIVER_VERSION,
          healthData: CURRENT_HEALTH_DATA_CONSENT_VERSION,
        },
      },
    },
    create: {
      id: "seed_small_group_enrollment",
      programmeId: programme.id,
      userId,
      attendeeName: "Maya Monthly",
      attendeeEmail: "member-monthly@shrutiturner.local",
      sessionsAttended: 0,
      progressSummary: "Seeded open programme enrolment for local QA.",
      status: SmallGroupEnrollmentStatus.active,
      pricePaidPence: template.defaultPricePence ?? 18000,
      complianceSnapshotJson: {
        versions: {
          terms: CURRENT_TERMS_VERSION,
          healthWaiver: CURRENT_HEALTH_WAIVER_VERSION,
          healthData: CURRENT_HEALTH_DATA_CONSENT_VERSION,
        },
      },
    },
  });
}

async function main() {
  console.log("Running existing billing/class seed dataset...");
  runSeedBillingDataset();

  console.log("Seeding local bootstrap users, policy versions and legal acceptance history...");
  await seedAdminUsers();
  const policies = await ensurePolicyVersions();
  const legacyPolicies = new Map(
    (
      await prisma.policyDocumentVersion.findMany({
        where: {
          type: { in: LEGACY_POLICY_SEEDS.map((seed) => seed.type) },
          version: { in: LEGACY_POLICY_SEEDS.map((seed) => seed.version) },
        },
      })
    ).map((policy) => [policy.type, policy])
  );

  const { monthlyReadyUser, retreatUser } = await seedScenarioUsers(policies, legacyPolicies);
  await seedCurrentAcceptancesForLocalUsers(policies);

  const instructor = await prisma.user.findFirst({
    where: { role: UserRole.admin },
    select: { id: true },
  });

  console.log("Seeding retreat inventory and balance-due booking...");
  await seedRetreatInventory(retreatUser.id, instructor?.id);

  console.log("Seeding a live small-group programme run...");
  await seedSmallGroupProgramme(monthlyReadyUser.id, instructor?.id);

  console.log("Local bootstrap seed complete.");
  console.log(`Login with ${monthlyReadyUser.email} using code ${DEFAULT_MEMBER_AUTH_CODE}`);
  console.log("Additional seeded members:");
  console.log("- member-active@shrutiturner.local");
  console.log("- member-credits@shrutiturner.local");
  console.log("- member-retreat@shrutiturner.local");
  console.log("- member-legal-refresh@shrutiturner.local");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
