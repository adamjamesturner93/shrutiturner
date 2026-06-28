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
  RetreatPaymentStatus,
  UserRole,
} from "@prisma/client";
import {
  CURRENT_HEALTH_DATA_CONSENT_VERSION,
  CURRENT_HEALTH_WAIVER_VERSION,
  CURRENT_TERMS_VERSION,
} from "../src/data/legal-documents.ts";
import { retreats } from "../src/data/retreat-data.ts";
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

function toSeedKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
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
  const adminEmails = (process.env.ADMIN_EMAILS || "tech@thechronicyogini.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  for (const email of adminEmails) {
    const isPrimaryInstructor = email === "tech@thechronicyogini.com";
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
        { email: { equals: "tech@thechronicyogini.com" } },
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
      const retreatDate = await prisma.retreatDate.upsert({
        where: { externalDateId: date.id },
        update: {
          retreatSlug: retreat.slug,
          retreatTitleSnapshot: retreat.title,
          retreatLocationSnapshot: retreat.location,
          startsAt: new Date(`${date.startDate}T15:00:00.000Z`),
          endsAt: new Date(`${date.endDate}T10:00:00.000Z`),
          capacity: date.totalSpaces,
          status: date.availableSpaces > 0 ? "open" : "sold_out",
          currency: retreat.currency,
          pricePence: retreat.normalPrice * 100,
          depositAmountPence: date.roomOptions[0]?.depositPence ?? 30000,
          balanceDueAt: datePlus(45),
        },
        create: {
          id: retreatDateId,
          externalDateId: date.id,
          retreatSlug: retreat.slug,
          retreatTitleSnapshot: retreat.title,
          retreatLocationSnapshot: retreat.location,
          startsAt: new Date(`${date.startDate}T15:00:00.000Z`),
          endsAt: new Date(`${date.endDate}T10:00:00.000Z`),
          capacity: date.totalSpaces,
          status: date.availableSpaces > 0 ? "open" : "sold_out",
          currency: retreat.currency,
          pricePence: retreat.normalPrice * 100,
          depositAmountPence: date.roomOptions[0]?.depositPence ?? 30000,
          balanceDueAt: datePlus(45),
        },
      });

      for (const roomOption of date.roomOptions) {
        await prisma.retreatRoomOption.upsert({
          where: {
            retreatDateId_externalRoomOptionId: {
              retreatDateId: retreatDate.id,
              externalRoomOptionId: roomOption.id,
            },
          },
          update: {
            label: roomOption.label,
            description: roomOption.description,
            roomType: roomOption.type,
            guestsIncluded: roomOption.guestsIncluded,
            capacity: roomOption.capacity,
            availableSpots: roomOption.availableSpots,
            pricePence: roomOption.normalPricePence,
            depositAmountPence: roomOption.depositPence ?? 30000,
            isWaitlistOnly: roomOption.isWaitlistOnly === true,
          },
          create: {
            id: `seed_retreat_room_${retreat.slug}_${roomOption.id}`,
            retreatDateId: retreatDate.id,
            externalRoomOptionId: roomOption.id,
            label: roomOption.label,
            description: roomOption.description,
            roomType: roomOption.type,
            guestsIncluded: roomOption.guestsIncluded,
            capacity: roomOption.capacity,
            availableSpots: roomOption.availableSpots,
            pricePence: roomOption.normalPricePence,
            depositAmountPence: roomOption.depositPence ?? 30000,
            isWaitlistOnly: roomOption.isWaitlistOnly === true,
          },
        });
      }

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

  const sankalpaDate = await prisma.retreatDate.findUniqueOrThrow({
    where: { externalDateId: "1a" },
    include: { roomOptions: true },
  });
  const roomOption =
    sankalpaDate.roomOptions.find((item) => item.externalRoomOptionId === "1a-single-room") ||
    sankalpaDate.roomOptions[0];
  if (!roomOption) {
    throw new Error("Seed retreat room option missing for Sankalpa.");
  }

  const depositAmountPence = Math.min(
    roomOption.depositAmountPence || 30000,
    roomOption.pricePence
  );
  const balanceAmountPence = Math.max(0, roomOption.pricePence - depositAmountPence);

  await prisma.retreatBooking.upsert({
    where: { id: "seed_retreat_booking_balance_due" },
    update: {
      retreatDateId: sankalpaDate.id,
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
      balanceDueAt: datePlus(45),
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
      retreatDateId: sankalpaDate.id,
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
      balanceDueAt: datePlus(45),
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
