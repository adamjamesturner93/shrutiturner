import { PrismaPg } from "@prisma/adapter-pg";
import {
  ClassBookingStatus,
  ClassSessionStatus,
  ClassWaitlistStatus,
  MembershipPlan,
  MembershipStatus,
  PrismaClient,
  ReferralEventStatus,
  ReferralLedgerType,
  UserRole,
} from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

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
  throw new Error("Missing DATABASE_URL or DIRECT_URL for billing seed script.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const plans: MembershipPlan[] = ["movewell", "instructor"];
const statuses: MembershipStatus[] = ["active", "paused", "cancelled", "expired"];

function membershipPricePence(plan: MembershipPlan) {
  if (plan === "movewell") return 2900;
  return 0;
}

function classesPerWeek(plan: MembershipPlan) {
  if (plan === "movewell" || plan === "instructor") return 99;
  return 0;
}

function datePlus(days: number) {
  return new Date(Date.now() + days * 86400000);
}

async function upsertUser(index: number) {
  const firstName = [
    "Sarah",
    "James",
    "Priya",
    "David",
    "Emily",
    "Tom",
    "Aisha",
    "Marcus",
    "Claire",
    "Rachel",
    "Olivia",
    "Nathan",
    "Imogen",
    "Luca",
    "Hannah",
    "Elliot",
    "Maya",
    "Farah",
    "Noah",
    "Amelia",
    "Kai",
    "Leah",
    "Ben",
    "Sofia",
    "Arjun",
  ][index];

  const lastName = [
    "Chen",
    "Whitfield",
    "Patel",
    "Okafor",
    "Richards",
    "Bennett",
    "Mohammed",
    "Lee",
    "Wilson",
    "Thompson",
    "Grant",
    "Carter",
    "Mills",
    "Bianchi",
    "Cole",
    "Fisher",
    "Khan",
    "Rahman",
    "Price",
    "Watson",
    "Ahmed",
    "Hart",
    "Walker",
    "Nolan",
    "Singh",
  ][index];

  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
  const plan = plans[index % plans.length];
  const status = statuses[index % statuses.length];

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      role: plan === "instructor" ? UserRole.admin : UserRole.student,
      referralCode: `${firstName.slice(0, 5).toUpperCase()}${String(index + 10)}`,
      isCoachingClient: index % 5 === 0,
      timezone: "Europe/London",
      dateFormat: "DD/MM/YYYY",
      isOnboarded: true,
      adminNotes: index % 3 === 0 ? "Needs pacing support during flare weeks." : null,
    },
    create: {
      email,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      role: plan === "instructor" ? UserRole.admin : UserRole.student,
      referralCode: `${firstName.slice(0, 5).toUpperCase()}${String(index + 10)}`,
      isCoachingClient: index % 5 === 0,
      timezone: "Europe/London",
      dateFormat: "DD/MM/YYYY",
      isOnboarded: true,
      adminNotes: index % 3 === 0 ? "Needs pacing support during flare weeks." : null,
    },
  });

  await prisma.membershipSubscription.upsert({
    where: { id: `seed_membership_${index}` },
    update: {
      userId: user.id,
      plan,
      status,
      pricePence: membershipPricePence(plan),
      classesPerWeek: classesPerWeek(plan),
      classesUsedThisWeek: plan === "instructor" ? 0 : index % 4,
      startsAt: datePlus(-60),
      renewsAt: status === "active" ? datePlus(14) : null,
      endsAt: status === "cancelled" || status === "expired" ? datePlus(-7) : null,
      cancelAtPeriodEnd: status === "cancelled",
    },
    create: {
      id: `seed_membership_${index}`,
      userId: user.id,
      plan,
      status,
      pricePence: membershipPricePence(plan),
      currency: "GBP",
      classesPerWeek: classesPerWeek(plan),
      classesUsedThisWeek: plan === "instructor" ? 0 : index % 4,
      startsAt: datePlus(-60),
      renewsAt: status === "active" ? datePlus(14) : null,
      endsAt: status === "cancelled" || status === "expired" ? datePlus(-7) : null,
      cancelAtPeriodEnd: status === "cancelled",
    },
  });

  await prisma.creditLedgerEntry.upsert({
    where: { id: `seed_credit_${index}_1` },
    update: {
      userId: user.id,
      amount: 10 - (index % 6),
      type: "purchase",
      description: "Seed credit bundle",
      sourceRef: `seed:bundle:${index}`,
      expiresAt: datePlus(35),
    },
    create: {
      id: `seed_credit_${index}_1`,
      userId: user.id,
      amount: 10 - (index % 6),
      type: "purchase",
      description: "Seed credit bundle",
      sourceRef: `seed:bundle:${index}`,
      expiresAt: datePlus(35),
    },
  });

  if (index % 2 === 0) {
    await prisma.referralLedgerEntry.upsert({
      where: { id: `seed_referral_ledger_${index}` },
      update: {
        userId: user.id,
        amountPence: 1000,
        currency: "GBP",
        type: ReferralLedgerType.reward,
        description: "Seed referral reward",
      },
      create: {
        id: `seed_referral_ledger_${index}`,
        userId: user.id,
        amountPence: 1000,
        currency: "GBP",
        type: ReferralLedgerType.reward,
        description: "Seed referral reward",
      },
    });
  }

  await prisma.userNotificationPreference.upsert({
    where: { userId: user.id },
    update: {
      classReminders: index % 2 === 0,
      scheduleUpdates: true,
      programAnnouncements: index % 3 !== 0,
      marketingEmails: index % 4 !== 0 || index % 5 !== 0,
    },
    create: {
      userId: user.id,
      classReminders: index % 2 === 0,
      scheduleUpdates: true,
      programAnnouncements: index % 3 !== 0,
      marketingEmails: index % 4 !== 0 || index % 5 !== 0,
    },
  });

  await prisma.healthProfile.upsert({
    where: { userId: user.id },
    update: {
      additionalNotes:
        index % 2 === 0
          ? "Morning stiffness around wrists and shoulders."
          : "Energy fluctuates day to day.",
      lastUpdatedAt: datePlus(-(index % 20)),
    },
    create: {
      userId: user.id,
      additionalNotes:
        index % 2 === 0
          ? "Morning stiffness around wrists and shoulders."
          : "Energy fluctuates day to day.",
      lastUpdatedAt: datePlus(-(index % 20)),
    },
  });

  return user;
}

async function seedReferrals(users: Array<{ id: string; referralCode: string | null }>) {
  for (let i = 1; i < users.length; i += 4) {
    const referrer = users[i - 1];
    const referred = users[i];
    if (!referrer.referralCode) continue;

    await prisma.referralEvent.upsert({
      where: {
        referrerUserId_referredUserId: {
          referrerUserId: referrer.id,
          referredUserId: referred.id,
        },
      },
      update: {
        status: ReferralEventStatus.rewarded,
        referralCodeSnapshot: referrer.referralCode,
        qualifiedAt: datePlus(-30),
        rewardedAt: datePlus(-29),
      },
      create: {
        referrerUserId: referrer.id,
        referredUserId: referred.id,
        referralCodeSnapshot: referrer.referralCode,
        status: ReferralEventStatus.rewarded,
        qualifiedAt: datePlus(-30),
        rewardedAt: datePlus(-29),
      },
    });
  }
}

async function seedClassSessions(userIds: string[]) {
  const instructor = await prisma.user.findFirst({
    where: { role: UserRole.admin },
    select: { id: true },
  });
  if (!instructor) return;

  const templates = [
    {
      slug: "adaptive-yoga-flow",
      title: "Adaptive Yoga Flow",
      type: "Yoga",
      level: "All levels",
      durationMinutes: 60,
      capacity: 10,
    },
    {
      slug: "strength-foundations",
      title: "Strength Foundations",
      type: "Strength",
      level: "Beginner",
      durationMinutes: 45,
      capacity: 8,
    },
    {
      slug: "chair-based-strength",
      title: "Chair-Based Strength",
      type: "Strength",
      level: "Adaptive",
      durationMinutes: 45,
      capacity: 8,
    },
  ];

  for (let week = 0; week < 8; week += 1) {
    for (let i = 0; i < templates.length; i += 1) {
      const template = templates[i];
      const start = new Date();
      start.setUTCDate(start.getUTCDate() + week * 7 + i + 1);
      start.setUTCHours(9 + i * 2, 0, 0, 0);
      const end = new Date(start.getTime() + template.durationMinutes * 60_000);
      const sessionId = `seed_class_${week}_${i}`;

      await prisma.classSession.upsert({
        where: { id: sessionId },
        update: {
          classDefinitionSlug: template.slug,
          titleSnapshot: template.title,
          typeSnapshot: template.type,
          levelSnapshot: template.level,
          durationMinutes: template.durationMinutes,
          startsAtUtc: start,
          endsAtUtc: end,
          capacity: template.capacity,
          status: ClassSessionStatus.scheduled,
          instructorUserId: instructor.id,
        },
        create: {
          id: sessionId,
          classDefinitionSlug: template.slug,
          titleSnapshot: template.title,
          typeSnapshot: template.type,
          levelSnapshot: template.level,
          durationMinutes: template.durationMinutes,
          startsAtUtc: start,
          endsAtUtc: end,
          timezone: "Europe/London",
          capacity: template.capacity,
          status: ClassSessionStatus.scheduled,
          instructorUserId: instructor.id,
        },
      });
    }
  }

  const targetSession = await prisma.classSession.findUnique({
    where: { id: "seed_class_0_0" },
    select: { id: true },
  });

  if (!targetSession) return;

  for (let i = 0; i < Math.min(10, userIds.length); i += 1) {
    await prisma.classBooking.upsert({
      where: { sessionId_userId: { sessionId: targetSession.id, userId: userIds[i] } },
      update: {
        status: i < 8 ? ClassBookingStatus.booked : ClassBookingStatus.cancelled,
      },
      create: {
        sessionId: targetSession.id,
        userId: userIds[i],
        status: i < 8 ? ClassBookingStatus.booked : ClassBookingStatus.cancelled,
      },
    });
  }

  await prisma.classWaitlistEntry.upsert({
    where: { sessionId_userId: { sessionId: targetSession.id, userId: userIds[10] } },
    update: {
      status: ClassWaitlistStatus.waiting,
      position: 1,
    },
    create: {
      sessionId: targetSession.id,
      userId: userIds[10],
      status: ClassWaitlistStatus.waiting,
      position: 1,
    },
  });
}

async function seedThemedWeeks() {
  const themedWeeks = [
    {
      slug: "pain-management-week",
      title: "Pain Management Week",
      shortDescription:
        "A focused run of classes exploring pacing, flare-aware movement, and strategies that help you keep moving without boom-and-bust.",
      audience: "Best for people navigating pain spikes and unpredictable symptoms.",
      ctaHref: "/schedule",
      ctaLabel: "See What's Running",
      startDate: new Date("2026-03-09T00:00:00.000Z"),
      endDate: new Date("2026-03-15T23:59:59.999Z"),
      sortOrder: 0,
    },
    {
      slug: "pelvic-floor-health-week",
      title: "Pelvic Floor Health Week",
      shortDescription:
        "All your regular classes this week will incorporate pelvic floor-aware cueing, breath strategies, and strength work that supports pressure management.",
      audience:
        "Best for clients who want more confidence, understanding, and support around pelvic floor health.",
      ctaHref: "/classes",
      ctaLabel: "Register",
      startDate: new Date("2026-03-23T00:00:00.000Z"),
      endDate: new Date("2026-03-29T23:59:59.999Z"),
      sortOrder: 1,
    },
    {
      slug: "hypermobility-support-week",
      title: "Hypermobility Support Week",
      shortDescription:
        "A themed class focus on stability, control, and confidence for hypermobile bodies that need strength more than stretching.",
      audience: "Best for people who need more stability, strength, and body trust.",
      ctaHref: "/classes",
      ctaLabel: "Register",
      startDate: new Date("2026-04-20T00:00:00.000Z"),
      endDate: new Date("2026-04-26T23:59:59.999Z"),
      sortOrder: 2,
    },
  ];

  for (const themedWeek of themedWeeks) {
    await prisma.themedWeek.upsert({
      where: { slug: themedWeek.slug },
      update: themedWeek,
      create: themedWeek,
    });
  }
}

async function main() {
  const users: Array<{ id: string; referralCode: string | null }> = [];

  for (let i = 0; i < 25; i += 1) {
    const user = await upsertUser(i);
    users.push({ id: user.id, referralCode: user.referralCode });
  }

  await seedReferrals(users);
  await seedClassSessions(users.map((u) => u.id));
  await seedThemedWeeks();

  console.log(
    "Seeded billing dataset: 25 members with membership, credit, referral, health, class sessions, and themed weeks."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
