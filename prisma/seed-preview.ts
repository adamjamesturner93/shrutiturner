import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  AcceptanceType,
  BookingEntitlementType,
  MembershipBillingInterval,
  MembershipPlan,
  MembershipStatus,
  PrismaClient,
  UserRole,
} from "@prisma/client";

function readEnvValue(key: "DIRECT_URL" | "DATABASE_URL"): string | undefined {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return undefined;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    if (trimmed.slice(0, idx).trim() !== key) continue;
    return trimmed
      .slice(idx + 1)
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
  throw new Error("Missing DATABASE_URL or DIRECT_URL for preview seed script.");
}

if (process.env.VERCEL_ENV === "production" && process.env.ALLOW_PREVIEW_FIXTURES !== "1") {
  throw new Error("Preview fixtures are blocked in production unless ALLOW_PREVIEW_FIXTURES=1.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const namespace = (process.env.PREVIEW_FIXTURE_NAMESPACE || "preview").trim().toLowerCase();
const authCode = (process.env.PREVIEW_FIXTURE_AUTH_CODE || "123456").trim();
const authCodeExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
const startsAtUtc = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
const endsAtUtc = new Date(startsAtUtc.getTime() + 45 * 60 * 1000);

function fixtureEmail(label: string) {
  return `${namespace}.${label}@shrutiturner.preview.invalid`;
}

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: fixtureEmail("owner") },
    update: {
      role: UserRole.owner_admin,
      firstName: "Preview",
      lastName: "Owner",
      name: "Preview Owner",
      authCode,
      authCodeExpiry,
      emailVerified: new Date(),
    },
    create: {
      email: fixtureEmail("owner"),
      role: UserRole.owner_admin,
      firstName: "Preview",
      lastName: "Owner",
      name: "Preview Owner",
      authCode,
      authCodeExpiry,
      emailVerified: new Date(),
    },
  });

  const instructor = await prisma.user.upsert({
    where: { email: fixtureEmail("instructor") },
    update: {
      role: UserRole.admin,
      firstName: "Preview",
      lastName: "Instructor",
      name: "Preview Instructor",
      instructorProfileEntryId: "preview-instructor-profile",
      authCode,
      authCodeExpiry,
      emailVerified: new Date(),
    },
    create: {
      email: fixtureEmail("instructor"),
      role: UserRole.admin,
      firstName: "Preview",
      lastName: "Instructor",
      name: "Preview Instructor",
      instructorProfileEntryId: "preview-instructor-profile",
      authCode,
      authCodeExpiry,
      emailVerified: new Date(),
    },
  });

  const member = await prisma.user.upsert({
    where: { email: fixtureEmail("member") },
    update: {
      role: UserRole.member,
      firstName: "Preview",
      lastName: "Member",
      name: "Preview Member",
      authCode,
      authCodeExpiry,
      emailVerified: new Date(),
      hasAgreedToTerms: true,
      hasAgreedToHealth: true,
    },
    create: {
      email: fixtureEmail("member"),
      role: UserRole.member,
      firstName: "Preview",
      lastName: "Member",
      name: "Preview Member",
      authCode,
      authCodeExpiry,
      emailVerified: new Date(),
      hasAgreedToTerms: true,
      hasAgreedToHealth: true,
    },
  });

  await prisma.userNotificationPreference.upsert({
    where: { userId: member.id },
    update: {},
    create: {
      userId: member.id,
      marketingEmails: true,
      classReminders: true,
      scheduleUpdates: true,
      programAnnouncements: true,
    },
  });

  for (const type of [
    AcceptanceType.terms,
    AcceptanceType.health_waiver,
    AcceptanceType.health_data,
  ]) {
    await prisma.acceptanceEvent.upsert({
      where: {
        id: `${namespace}_${member.id}_${type}`,
      },
      update: {
        acceptedAt: new Date(),
      },
      create: {
        id: `${namespace}_${member.id}_${type}`,
        userId: member.id,
        actorUserId: member.id,
        type,
        version: "preview-fixture-v1",
        acceptanceSurface: "preview_seed",
        acceptedAt: new Date(),
      },
    });
  }

  const session = await prisma.classSession.upsert({
    where: { generationKey: `${namespace}:preview-dashboard-session` },
    update: {
      startsAtUtc,
      endsAtUtc,
      instructorUserId: instructor.id,
      instructorProfileEntryId: instructor.instructorProfileEntryId,
      instructorNameSnapshot: instructor.name,
    },
    create: {
      classDefinitionSlug: "preview-strength-foundations",
      generationKey: `${namespace}:preview-dashboard-session`,
      titleSnapshot: "Preview Strength Foundations",
      typeSnapshot: "strength",
      durationMinutes: 45,
      levelSnapshot: "open-level",
      startsAtUtc,
      endsAtUtc,
      timezone: "Europe/London",
      capacity: 12,
      instructorUserId: instructor.id,
      instructorProfileEntryId: instructor.instructorProfileEntryId,
      instructorNameSnapshot: instructor.name,
    },
  });

  await prisma.membershipSubscription.upsert({
    where: { stripeSubscriptionId: `${namespace}-preview-membership` },
    update: {
      userId: member.id,
      status: MembershipStatus.active,
      plan: MembershipPlan.movewell,
      billingInterval: MembershipBillingInterval.monthly,
      pricePence: 2900,
      classesPerWeek: 99,
      classesUsedThisWeek: 1,
      startsAt: new Date(),
      renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    create: {
      userId: member.id,
      stripeSubscriptionId: `${namespace}-preview-membership`,
      plan: MembershipPlan.movewell,
      status: MembershipStatus.active,
      billingInterval: MembershipBillingInterval.monthly,
      pricePence: 2900,
      currency: "GBP",
      classesPerWeek: 99,
      classesUsedThisWeek: 1,
      startsAt: new Date(),
      renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.classBooking.upsert({
    where: {
      sessionId_userId: {
        sessionId: session.id,
        userId: member.id,
      },
    },
    update: {
      entitlementType: BookingEntitlementType.membership,
    },
    create: {
      sessionId: session.id,
      userId: member.id,
      entitlementType: BookingEntitlementType.membership,
    },
  });

  console.log("Preview fixtures seeded.");
  console.log(`Owner: ${owner.email}`);
  console.log(`Member: ${member.email}`);
  console.log(`Instructor: ${instructor.email}`);
  console.log(`Auth code: ${authCode}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
