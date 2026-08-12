import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { AcceptanceType, PrismaClient, RetreatLiveRoomState, UserRole } from "@prisma/client";

const PREFIX = "manual-retreat-live";
// Operational retreat reads deliberately require a published Contentful template.
// Keep fixture identity in externalDateId/title while reusing the published online template.
const CONTENTFUL_RETREAT_SLUG = "sankalpa-online-workshop";
const LOGIN_CODE = "123456";
const LOGIN_CODE_EXPIRY = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
const ACCEPTANCE_SURFACE = "manual_retreat_live_prerequisite";

function readEnvValue(key: "DIRECT_URL" | "DATABASE_URL") {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return process.env[key];
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 0 || trimmed.slice(0, separatorIndex).trim() !== key) continue;
    return trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
  }
  return process.env[key];
}

const connectionString = readEnvValue("DATABASE_URL") || readEnvValue("DIRECT_URL");
if (!connectionString) throw new Error("Missing DATABASE_URL or DIRECT_URL.");

const databaseUrl = new URL(connectionString);
if (!["127.0.0.1", "localhost"].includes(databaseUrl.hostname)) {
  throw new Error(`Refusing to seed non-local database host: ${databaseUrl.hostname}`);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const accounts = [
  {
    key: "admin",
    email: `${PREFIX}-admin@example.com`,
    firstName: "Rhea",
    lastName: "Admin",
    role: UserRole.admin,
  },
  {
    key: "host1",
    email: `${PREFIX}-host-1@example.com`,
    firstName: "Harper",
    lastName: "Host",
    role: UserRole.student,
  },
  {
    key: "host2",
    email: `${PREFIX}-host-2@example.com`,
    firstName: "Indigo",
    lastName: "Host",
    role: UserRole.student,
  },
  {
    key: "attendee1",
    email: `${PREFIX}-attendee-1@example.com`,
    firstName: "Asha",
    lastName: "Attendee",
    role: UserRole.student,
  },
  {
    key: "attendee2",
    email: `${PREFIX}-attendee-2@example.com`,
    firstName: "Ben",
    lastName: "Attendee",
    role: UserRole.student,
  },
  {
    key: "selfPurchaser",
    email: `${PREFIX}-self-purchaser@example.com`,
    firstName: "Priya",
    lastName: "Purchaser",
    role: UserRole.student,
  },
  {
    key: "giftPurchaser",
    email: `${PREFIX}-gift-purchaser@example.com`,
    firstName: "Gina",
    lastName: "Gifter",
    role: UserRole.student,
  },
  {
    key: "giftRecipient",
    email: `${PREFIX}-gift-recipient@example.com`,
    firstName: null,
    lastName: null,
    role: UserRole.student,
  },
  {
    key: "unrelated",
    email: `${PREFIX}-unrelated@example.com`,
    firstName: "Una",
    lastName: "Related",
    role: UserRole.student,
  },
] as const;

const retreatScenarios = [
  {
    key: "more-than-24h",
    title: "Manual Live Retreat — More Than 24 Hours",
    startsInMinutes: 72 * 60,
    durationMinutes: 120,
    status: "open",
    liveRoomState: RetreatLiveRoomState.unprepared,
  },
  {
    key: "around-24h",
    title: "Manual Live Retreat — Around 24 Hours",
    startsInMinutes: 24 * 60,
    durationMinutes: 120,
    status: "open",
    liveRoomState: RetreatLiveRoomState.unprepared,
  },
  {
    key: "around-1h",
    title: "Manual Live Retreat — Around 1 Hour",
    startsInMinutes: 60,
    durationMinutes: 120,
    status: "open",
    liveRoomState: RetreatLiveRoomState.unprepared,
  },
  {
    key: "live-window",
    title: "Manual Live Retreat — Live Access Window",
    startsInMinutes: -15,
    durationMinutes: 120,
    status: "open",
    liveRoomState: RetreatLiveRoomState.unprepared,
  },
  {
    key: "ended",
    title: "Manual Live Retreat — Ended",
    startsInMinutes: -180,
    durationMinutes: 120,
    status: "completed",
    liveRoomState: RetreatLiveRoomState.ended,
  },
] as const;

async function main() {
  const existingDates = await prisma.retreatDate.findMany({
    where: { externalDateId: { startsWith: PREFIX } },
    select: { id: true },
  });
  const existingDateIds = existingDates.map((date) => date.id);

  await prisma.$transaction(async (tx) => {
    await tx.giftPurchase.deleteMany({ where: { code: { startsWith: PREFIX } } });
    if (existingDateIds.length) {
      await tx.retreatBooking.deleteMany({ where: { retreatDateId: { in: existingDateIds } } });
      await tx.retreatDate.deleteMany({ where: { id: { in: existingDateIds } } });
    }
  });

  const currentPolicies = await prisma.policyDocumentVersion.findMany({
    where: {
      isCurrent: true,
      type: {
        in: [AcceptanceType.terms, AcceptanceType.health_waiver, AcceptanceType.health_data],
      },
    },
  });
  if (currentPolicies.length !== 3) {
    throw new Error(
      "The local database must have current terms, health waiver, and health-data policies before this fixture can be created."
    );
  }

  const users = new Map<string, Awaited<ReturnType<typeof prisma.user.upsert>>>();
  for (const account of accounts) {
    const isGiftRecipient = account.key === "giftRecipient";
    const user = await prisma.user.upsert({
      where: { email: account.email },
      create: {
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        name: account.firstName ? `${account.firstName} ${account.lastName}` : null,
        role: account.role,
        emailVerified: new Date(),
        isOnboarded: !isGiftRecipient,
        authCode: LOGIN_CODE,
        authCodeExpiry: LOGIN_CODE_EXPIRY,
      },
      update: {
        firstName: account.firstName,
        lastName: account.lastName,
        name: account.firstName ? `${account.firstName} ${account.lastName}` : null,
        role: account.role,
        deletedAt: null,
        emailVerified: new Date(),
        isOnboarded: !isGiftRecipient,
        authCode: LOGIN_CODE,
        authCodeExpiry: LOGIN_CODE_EXPIRY,
      },
    });
    users.set(account.key, user);

    await prisma.authChallenge.deleteMany({ where: { email: account.email } });
    await prisma.acceptanceEvent.deleteMany({
      where: { userId: user.id, acceptanceSurface: ACCEPTANCE_SURFACE },
    });
    if (!isGiftRecipient) {
      await prisma.acceptanceEvent.createMany({
        data: currentPolicies.map((policy) => ({
          userId: user.id,
          actorUserId: user.id,
          type: policy.type,
          policyVersionId: policy.id,
          version: policy.version,
          acceptanceSurface: ACCEPTANCE_SURFACE,
          acceptedAt: new Date(),
        })),
      });
      const terms = currentPolicies.find((policy) => policy.type === AcceptanceType.terms)!;
      const waiver = currentPolicies.find(
        (policy) => policy.type === AcceptanceType.health_waiver
      )!;
      const healthData = currentPolicies.find(
        (policy) => policy.type === AcceptanceType.health_data
      )!;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          hasAgreedToTerms: true,
          termsAgreedAt: new Date(),
          acceptedTermsVersion: terms.version,
          hasAgreedToHealth: true,
          healthAgreedAt: new Date(),
          acceptedHealthWaiverVersion: waiver.version,
          hasConsentedToHealthData: true,
          healthDataConsentedAt: new Date(),
          acceptedHealthDataConsentVersion: healthData.version,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          hasAgreedToTerms: false,
          termsAgreedAt: null,
          acceptedTermsVersion: null,
          hasAgreedToHealth: false,
          healthAgreedAt: null,
          acceptedHealthWaiverVersion: null,
          hasConsentedToHealthData: false,
          healthDataConsentedAt: null,
          acceptedHealthDataConsentVersion: null,
        },
      });
    }
  }

  const now = new Date();
  const dates = new Map<string, Awaited<ReturnType<typeof prisma.retreatDate.create>>>();
  const roomOptions = new Map<
    string,
    Awaited<ReturnType<typeof prisma.retreatRoomOption.create>>
  >();
  for (const scenario of retreatScenarios) {
    const startsAt = new Date(now.getTime() + scenario.startsInMinutes * 60_000);
    const endsAt = new Date(startsAt.getTime() + scenario.durationMinutes * 60_000);
    const retreatDate = await prisma.retreatDate.create({
      data: {
        externalDateId: `${PREFIX}-${scenario.key}`,
        retreatSlug: CONTENTFUL_RETREAT_SLUG,
        retreatTitleSnapshot: scenario.title,
        retreatLocationSnapshot: "Online — disposable manual test fixture",
        retreatType: "online",
        timezone: "Europe/London",
        startsAt,
        endsAt,
        capacity: 30,
        status: scenario.status,
        pricePence: 7500,
        depositAmountPence: 7500,
        isRecorded: false,
        replayAvailable: false,
        replayAccessDurationDays: 30,
        chatEnabled: true,
        participantMicDefaultMuted: true,
        participantCameraDefaultOff: true,
        liveRoomState: scenario.liveRoomState,
        liveEndedAt: scenario.liveRoomState === RetreatLiveRoomState.ended ? endsAt : null,
        instructorAssignments: {
          create: [{ userId: users.get("host1")!.id }, { userId: users.get("host2")!.id }],
        },
      },
    });
    dates.set(scenario.key, retreatDate);
    const roomOption = await prisma.retreatRoomOption.create({
      data: {
        retreatDateId: retreatDate.id,
        externalRoomOptionId: `${PREFIX}-${scenario.key}-online-place`,
        label: "Online place",
        description: "Disposable online-retreat test place",
        roomType: "online",
        capacity: 30,
        availableSpots: 30,
        pricePence: 7500,
        roomCount: 30,
      },
    });
    roomOptions.set(scenario.key, roomOption);
  }

  async function createPaidBooking(
    accountKey: "attendee1" | "attendee2" | "selfPurchaser",
    scenarioKey: string
  ) {
    const user = users.get(accountKey)!;
    const retreatDate = dates.get(scenarioKey)!;
    const roomOption = roomOptions.get(scenarioKey)!;
    const booking = await prisma.retreatBooking.create({
      data: {
        retreatDateId: retreatDate.id,
        roomOptionId: roomOption.id,
        purchaserUserId: user.id,
        attendeeUserId: user.id,
        purchaserFirstName: user.firstName || "Manual",
        purchaserLastName: user.lastName || "Tester",
        purchaserEmail: user.email,
        attendeeFirstName: user.firstName || "Manual",
        attendeeLastName: user.lastName || "Tester",
        attendeeEmail: user.email,
        phone: "07000000000",
        emergencyContactName: "Manual Test Contact",
        emergencyContactPhone: "07000000001",
        medicalConditions: "Disposable test data — no real health information",
        mobilityNeeds: "Offer accessible movement options",
        totalPricePence: 7500,
        depositAmountPence: 7500,
        balanceAmountPence: 0,
        depositPaidPence: 7500,
        paymentStatus: "paid_in_full",
        bookingStatus: "paid_in_full",
        bookedAt: new Date(),
        depositPaidAt: new Date(),
      },
    });
    await prisma.retreatOnlineAccessEntitlement.create({
      data: {
        bookingId: booking.id,
        retreatDateId: retreatDate.id,
        userId: user.id,
        attendeeEmail: user.email,
        accessType: "live_and_replay",
        liveAccessEnabled: true,
        replayAccessEnabled: false,
        liveAccessStartsAt: new Date(retreatDate.startsAt.getTime() - 30 * 60_000),
        liveAccessEndsAt: new Date(retreatDate.endsAt.getTime() + 60 * 60_000),
      },
    });
    return booking;
  }

  const bookingLinks: Array<{ label: string; email: string; bookingId: string; url: string }> = [];
  for (const scenario of retreatScenarios) {
    for (const accountKey of ["attendee1", "attendee2"] as const) {
      const booking = await createPaidBooking(accountKey, scenario.key);
      bookingLinks.push({
        label: scenario.key,
        email: users.get(accountKey)!.email,
        bookingId: booking.id,
        url: `/dashboard/retreats/${booking.id}/live`,
      });
    }
  }
  const selfBooking = await createPaidBooking("selfPurchaser", "live-window");
  bookingLinks.push({
    label: "self-purchase-live-window",
    email: users.get("selfPurchaser")!.email,
    bookingId: selfBooking.id,
    url: `/dashboard/retreats/${selfBooking.id}/live`,
  });

  const around24 = dates.get("around-24h")!;
  const around24Room = roomOptions.get("around-24h")!;
  const gift = await prisma.giftPurchase.create({
    data: {
      code: `${PREFIX}-gift-claim`,
      type: "retreat",
      status: "purchased",
      purchaserUserId: users.get("giftPurchaser")!.id,
      purchaserFirstName: users.get("giftPurchaser")!.firstName || "Gina",
      purchaserLastName: users.get("giftPurchaser")!.lastName || "Gifter",
      purchaserEmail: users.get("giftPurchaser")!.email,
      recipientFirstName: "Rory",
      recipientLastName: "Recipient",
      recipientEmail: users.get("giftRecipient")!.email,
      recipientMessage: "Disposable manual-test gift",
      deliveryTarget: "recipient",
      productSlug: around24.retreatSlug,
      productTitleSnapshot: `${around24.retreatTitleSnapshot} — Online place`,
      totalPaidPence: 7500,
      nonRefundableAmountPence: 0,
      retreatDateId: around24.id,
      retreatRoomOptionId: around24Room.id,
      retreatGuestCount: 1,
      purchasedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("\nDisposable online-retreat manual fixtures created.\n");
  console.table(
    accounts.map((account) => ({ role: account.key, email: account.email, loginCode: LOGIN_CODE }))
  );
  console.table(
    retreatScenarios.map((scenario) => {
      const date = dates.get(scenario.key)!;
      return {
        scenario: scenario.key,
        retreatDateId: date.id,
        startsAt: date.startsAt.toISOString(),
        hostUrl: `/dashboard/retreats/host/${date.id}`,
      };
    })
  );
  console.table(bookingLinks);
  console.log(`Gift redemption URL: /gift/redeem/${gift.code}`);
  console.log(`Gift recipient: ${users.get("giftRecipient")!.email}`);
  console.log(
    "Run the app with NEXT_PUBLIC_E2E_TEST_MODE=1 and request a code; every fixture account will receive the fixed local code 123456 without sending email."
  );
  console.log("Do not run retreat reminder or recording jobs against these fixtures.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
