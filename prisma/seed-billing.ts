import { PrismaPg } from "@prisma/adapter-pg";
import {
  AttendanceSource,
  BookingEntitlementType,
  ClassBookingStatus,
  ClassRoomSetupStatus,
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

function atUtcTime(date: Date, hours: number, minutes = 0) {
  const value = new Date(date);
  value.setUTCHours(hours, minutes, 0, 0);
  return value;
}

async function upsertSeededClassScenarioUser(params: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}) {
  const user = await prisma.user.upsert({
    where: { email: params.email },
    update: {
      firstName: params.firstName,
      lastName: params.lastName,
      name: `${params.firstName} ${params.lastName}`,
      role: params.role,
      timezone: "Europe/London",
      dateFormat: "DD/MM/YYYY",
      isOnboarded: true,
    },
    create: {
      id: params.id,
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      name: `${params.firstName} ${params.lastName}`,
      role: params.role,
      timezone: "Europe/London",
      dateFormat: "DD/MM/YYYY",
      isOnboarded: true,
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

  return user;
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

async function seedDeterministicClassScenarios() {
  const instructor = await upsertSeededClassScenarioUser({
    id: "seed_class_instructor",
    email: "seed.classes.instructor@example.com",
    firstName: "Shruti",
    lastName: "Turner",
    role: UserRole.admin,
  });
  const unlimitedMember = await upsertSeededClassScenarioUser({
    id: "seed_class_member_unlimited",
    email: "seed.classes.member.unlimited@example.com",
    firstName: "Uma",
    lastName: "Member",
    role: UserRole.student,
  });
  const limitedMember = await upsertSeededClassScenarioUser({
    id: "seed_class_member_limited",
    email: "seed.classes.member.limited@example.com",
    firstName: "Liam",
    lastName: "Member",
    role: UserRole.student,
  });
  const creditMember = await upsertSeededClassScenarioUser({
    id: "seed_class_member_credit",
    email: "seed.classes.member.credit@example.com",
    firstName: "Cora",
    lastName: "Credit",
    role: UserRole.student,
  });

  await prisma.membershipSubscription.upsert({
    where: { id: "seed_class_membership_unlimited" },
    update: {
      userId: unlimitedMember.id,
      plan: MembershipPlan.movewell,
      status: MembershipStatus.active,
      pricePence: 2900,
      currency: "GBP",
      classesPerWeek: 99,
      classesUsedThisWeek: 1,
      startsAt: datePlus(-30),
      renewsAt: datePlus(14),
      endsAt: null,
      cancelAtPeriodEnd: false,
    },
    create: {
      id: "seed_class_membership_unlimited",
      userId: unlimitedMember.id,
      plan: MembershipPlan.movewell,
      status: MembershipStatus.active,
      pricePence: 2900,
      currency: "GBP",
      classesPerWeek: 99,
      classesUsedThisWeek: 1,
      startsAt: datePlus(-30),
      renewsAt: datePlus(14),
      cancelAtPeriodEnd: false,
    },
  });

  await prisma.membershipSubscription.upsert({
    where: { id: "seed_class_membership_limited" },
    update: {
      userId: limitedMember.id,
      plan: MembershipPlan.movewell,
      status: MembershipStatus.active,
      pricePence: 2900,
      currency: "GBP",
      classesPerWeek: 2,
      classesUsedThisWeek: 1,
      startsAt: datePlus(-30),
      renewsAt: datePlus(14),
      endsAt: null,
      cancelAtPeriodEnd: false,
    },
    create: {
      id: "seed_class_membership_limited",
      userId: limitedMember.id,
      plan: MembershipPlan.movewell,
      status: MembershipStatus.active,
      pricePence: 2900,
      currency: "GBP",
      classesPerWeek: 2,
      classesUsedThisWeek: 1,
      startsAt: datePlus(-30),
      renewsAt: datePlus(14),
      cancelAtPeriodEnd: false,
    },
  });

  await prisma.creditLedgerEntry.upsert({
    where: { id: "seed_class_credit_bundle" },
    update: {
      userId: creditMember.id,
      amount: 6,
      type: "purchase",
      description: "Seed class credit bundle",
      sourceRef: "seed:class-credit-bundle",
      expiresAt: datePlus(45),
    },
    create: {
      id: "seed_class_credit_bundle",
      userId: creditMember.id,
      amount: 6,
      type: "purchase",
      description: "Seed class credit bundle",
      sourceRef: "seed:class-credit-bundle",
      expiresAt: datePlus(45),
    },
  });

  const timetableSessionDate = atUtcTime(datePlus(2), 18, 0);
  const timetableSessionLocalDate = timetableSessionDate.toISOString().slice(0, 10);
  const exclusionDate = atUtcTime(datePlus(9), 18, 0).toISOString().slice(0, 10);

  await prisma.classTimetableRule.upsert({
    where: { id: "seed_timetable_rule_strength" },
    update: {
      classDefinitionSlug: "strength-foundations",
      weekday: timetableSessionDate.getUTCDay(),
      startsAtLocal: "18:00",
      durationMinutes: 45,
      timezone: "Europe/London",
      defaultCapacity: 10,
      instructorUserId: instructor.id,
      startsOn: new Date(`${timetableSessionLocalDate}T00:00:00.000Z`),
      endsOn: null,
      active: true,
      notes: "Seeded recurring timetable rule for automated tests.",
      createdByUserId: instructor.id,
    },
    create: {
      id: "seed_timetable_rule_strength",
      classDefinitionSlug: "strength-foundations",
      weekday: timetableSessionDate.getUTCDay(),
      startsAtLocal: "18:00",
      durationMinutes: 45,
      timezone: "Europe/London",
      defaultCapacity: 10,
      instructorUserId: instructor.id,
      startsOn: new Date(`${timetableSessionLocalDate}T00:00:00.000Z`),
      active: true,
      notes: "Seeded recurring timetable rule for automated tests.",
      createdByUserId: instructor.id,
    },
  });

  await prisma.classTimetableExclusion.upsert({
    where: { id: "seed_timetable_exclusion_strength" },
    update: {
      timetableRuleId: "seed_timetable_rule_strength",
      localDate: new Date(`${exclusionDate}T00:00:00.000Z`),
      reason: "Seeded exclusion date",
    },
    create: {
      id: "seed_timetable_exclusion_strength",
      timetableRuleId: "seed_timetable_rule_strength",
      localDate: new Date(`${exclusionDate}T00:00:00.000Z`),
      reason: "Seeded exclusion date",
    },
  });

  const sessions = [
    {
      id: "seed_class_timetable_booked",
      classDefinitionSlug: "strength-foundations",
      titleSnapshot: "Seeded Timetable Strength",
      typeSnapshot: "Strength",
      levelSnapshot: "Beginner",
      durationMinutes: 45,
      startsAtUtc: timetableSessionDate,
      capacity: 10,
      status: ClassSessionStatus.scheduled,
      timetableRuleId: "seed_timetable_rule_strength",
      localDate: timetableSessionLocalDate,
      generationKey: `seed_timetable_rule_strength:${timetableSessionLocalDate}`,
    },
    {
      id: "seed_class_future_available",
      classDefinitionSlug: "adaptive-yoga-flow",
      titleSnapshot: "Seeded Future Yoga Flow",
      typeSnapshot: "Yoga",
      levelSnapshot: "All levels",
      durationMinutes: 60,
      startsAtUtc: atUtcTime(datePlus(3), 9, 30),
      capacity: 12,
      status: ClassSessionStatus.scheduled,
      timetableRuleId: null,
      localDate: atUtcTime(datePlus(3), 0, 0).toISOString().slice(0, 10),
      generationKey: null,
    },
    {
      id: "seed_class_three_hour_with_attendees",
      classDefinitionSlug: "chair-based-strength",
      titleSnapshot: "Seeded Three Hour Reminder",
      typeSnapshot: "Strength",
      levelSnapshot: "Adaptive",
      durationMinutes: 45,
      startsAtUtc: new Date(Date.now() + 2.5 * 60 * 60 * 1000),
      capacity: 8,
      status: ClassSessionStatus.scheduled,
      timetableRuleId: null,
      localDate: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString().slice(0, 10),
      generationKey: null,
    },
    {
      id: "seed_class_three_hour_zero",
      classDefinitionSlug: "adaptive-yoga-flow",
      titleSnapshot: "Seeded Auto Cancel Empty Class",
      typeSnapshot: "Yoga",
      levelSnapshot: "All levels",
      durationMinutes: 60,
      startsAtUtc: new Date(Date.now() + 2.75 * 60 * 60 * 1000),
      capacity: 8,
      status: ClassSessionStatus.scheduled,
      timetableRuleId: null,
      localDate: new Date(Date.now() + 2.75 * 60 * 60 * 1000).toISOString().slice(0, 10),
      generationKey: null,
    },
    {
      id: "seed_class_last_cancel_window",
      classDefinitionSlug: "strength-foundations",
      titleSnapshot: "Seeded Last Cancel Strength",
      typeSnapshot: "Strength",
      levelSnapshot: "Beginner",
      durationMinutes: 45,
      startsAtUtc: new Date(Date.now() + 2.25 * 60 * 60 * 1000),
      capacity: 6,
      status: ClassSessionStatus.scheduled,
      timetableRuleId: null,
      localDate: new Date(Date.now() + 2.25 * 60 * 60 * 1000).toISOString().slice(0, 10),
      generationKey: null,
    },
    {
      id: "seed_class_full_waitlist",
      classDefinitionSlug: "adaptive-yoga-flow",
      titleSnapshot: "Seeded Full Waitlist Flow",
      typeSnapshot: "Yoga",
      levelSnapshot: "All levels",
      durationMinutes: 60,
      startsAtUtc: atUtcTime(datePlus(4), 11, 0),
      capacity: 2,
      status: ClassSessionStatus.scheduled,
      timetableRuleId: null,
      localDate: atUtcTime(datePlus(4), 0, 0).toISOString().slice(0, 10),
      generationKey: null,
    },
    {
      id: "seed_class_completed_attendance",
      classDefinitionSlug: "chair-based-strength",
      titleSnapshot: "Seeded Completed Attendance Class",
      typeSnapshot: "Strength",
      levelSnapshot: "Adaptive",
      durationMinutes: 45,
      startsAtUtc: atUtcTime(datePlus(-1), 17, 0),
      capacity: 8,
      status: ClassSessionStatus.completed,
      timetableRuleId: null,
      localDate: atUtcTime(datePlus(-1), 0, 0).toISOString().slice(0, 10),
      generationKey: null,
    },
  ] as const;

  for (const session of sessions) {
    const endsAtUtc = new Date(session.startsAtUtc.getTime() + session.durationMinutes * 60_000);

    await prisma.classSession.upsert({
      where: { id: session.id },
      update: {
        classDefinitionSlug: session.classDefinitionSlug,
        timetableRuleId: session.timetableRuleId,
        localDate: new Date(`${session.localDate}T00:00:00.000Z`),
        generationKey: session.generationKey,
        titleSnapshot: session.titleSnapshot,
        typeSnapshot: session.typeSnapshot,
        levelSnapshot: session.levelSnapshot,
        durationMinutes: session.durationMinutes,
        startsAtUtc: session.startsAtUtc,
        endsAtUtc,
        timezone: "Europe/London",
        capacity: session.capacity,
        status: session.status,
        instructorUserId: instructor.id,
        instructorNameSnapshot: instructor.name,
        roomSetupStatus: ClassRoomSetupStatus.ready,
        roomSetupError: null,
        dailyRoomName: `seed-room-${session.id}`,
        dailyRoomUrl: `https://example.daily.co/${session.id}`,
        reminderProcessedAt: null,
        autoCancelledForNoAttendanceAt: null,
        cancelReason: null,
      },
      create: {
        id: session.id,
        classDefinitionSlug: session.classDefinitionSlug,
        timetableRuleId: session.timetableRuleId,
        localDate: new Date(`${session.localDate}T00:00:00.000Z`),
        generationKey: session.generationKey,
        titleSnapshot: session.titleSnapshot,
        typeSnapshot: session.typeSnapshot,
        levelSnapshot: session.levelSnapshot,
        durationMinutes: session.durationMinutes,
        startsAtUtc: session.startsAtUtc,
        endsAtUtc,
        timezone: "Europe/London",
        capacity: session.capacity,
        status: session.status,
        instructorUserId: instructor.id,
        instructorNameSnapshot: instructor.name,
        roomSetupStatus: ClassRoomSetupStatus.ready,
        dailyRoomName: `seed-room-${session.id}`,
        dailyRoomUrl: `https://example.daily.co/${session.id}`,
      },
    });
  }

  await prisma.classBooking.upsert({
    where: {
      sessionId_userId: {
        sessionId: "seed_class_timetable_booked",
        userId: unlimitedMember.id,
      },
    },
    update: {
      status: ClassBookingStatus.booked,
      entitlementType: BookingEntitlementType.membership,
      cancelledAt: null,
    },
    create: {
      sessionId: "seed_class_timetable_booked",
      userId: unlimitedMember.id,
      status: ClassBookingStatus.booked,
      entitlementType: BookingEntitlementType.membership,
    },
  });

  await prisma.classBooking.upsert({
    where: {
      sessionId_userId: {
        sessionId: "seed_class_three_hour_with_attendees",
        userId: limitedMember.id,
      },
    },
    update: {
      status: ClassBookingStatus.booked,
      entitlementType: BookingEntitlementType.membership,
      cancelledAt: null,
    },
    create: {
      sessionId: "seed_class_three_hour_with_attendees",
      userId: limitedMember.id,
      status: ClassBookingStatus.booked,
      entitlementType: BookingEntitlementType.membership,
    },
  });

  await prisma.classBooking.upsert({
    where: {
      sessionId_userId: {
        sessionId: "seed_class_last_cancel_window",
        userId: unlimitedMember.id,
      },
    },
    update: {
      status: ClassBookingStatus.booked,
      entitlementType: BookingEntitlementType.membership,
      cancelledAt: null,
    },
    create: {
      sessionId: "seed_class_last_cancel_window",
      userId: unlimitedMember.id,
      status: ClassBookingStatus.booked,
      entitlementType: BookingEntitlementType.membership,
    },
  });

  await prisma.classBooking.upsert({
    where: {
      sessionId_userId: {
        sessionId: "seed_class_full_waitlist",
        userId: unlimitedMember.id,
      },
    },
    update: {
      status: ClassBookingStatus.booked,
      entitlementType: BookingEntitlementType.membership,
      cancelledAt: null,
    },
    create: {
      sessionId: "seed_class_full_waitlist",
      userId: unlimitedMember.id,
      status: ClassBookingStatus.booked,
      entitlementType: BookingEntitlementType.membership,
    },
  });

  await prisma.classBooking.upsert({
    where: {
      sessionId_userId: {
        sessionId: "seed_class_full_waitlist",
        userId: limitedMember.id,
      },
    },
    update: {
      status: ClassBookingStatus.booked,
      entitlementType: BookingEntitlementType.membership,
      cancelledAt: null,
    },
    create: {
      sessionId: "seed_class_full_waitlist",
      userId: limitedMember.id,
      status: ClassBookingStatus.booked,
      entitlementType: BookingEntitlementType.membership,
    },
  });

  await prisma.classWaitlistEntry.upsert({
    where: {
      sessionId_userId: {
        sessionId: "seed_class_full_waitlist",
        userId: creditMember.id,
      },
    },
    update: {
      status: ClassWaitlistStatus.waiting,
      position: 1,
      promotedAt: null,
    },
    create: {
      sessionId: "seed_class_full_waitlist",
      userId: creditMember.id,
      status: ClassWaitlistStatus.waiting,
      position: 1,
    },
  });

  await prisma.classBooking.upsert({
    where: {
      sessionId_userId: {
        sessionId: "seed_class_completed_attendance",
        userId: unlimitedMember.id,
      },
    },
    update: {
      status: ClassBookingStatus.booked,
      entitlementType: BookingEntitlementType.membership,
      firstJoinedAt: atUtcTime(datePlus(-1), 17, 2),
      lastJoinedAt: atUtcTime(datePlus(-1), 17, 35),
      lastLeftAt: atUtcTime(datePlus(-1), 17, 44),
      joinCount: 2,
      attendanceMarkedAt: atUtcTime(datePlus(-1), 17, 44),
      attendanceSource: AttendanceSource.daily,
      cancelledAt: null,
    },
    create: {
      sessionId: "seed_class_completed_attendance",
      userId: unlimitedMember.id,
      status: ClassBookingStatus.booked,
      entitlementType: BookingEntitlementType.membership,
      firstJoinedAt: atUtcTime(datePlus(-1), 17, 2),
      lastJoinedAt: atUtcTime(datePlus(-1), 17, 35),
      lastLeftAt: atUtcTime(datePlus(-1), 17, 44),
      joinCount: 2,
      attendanceMarkedAt: atUtcTime(datePlus(-1), 17, 44),
      attendanceSource: AttendanceSource.daily,
    },
  });

  await prisma.classBooking.upsert({
    where: {
      sessionId_userId: {
        sessionId: "seed_class_completed_attendance",
        userId: creditMember.id,
      },
    },
    update: {
      status: ClassBookingStatus.booked,
      entitlementType: BookingEntitlementType.credit,
      firstJoinedAt: null,
      lastJoinedAt: null,
      lastLeftAt: null,
      joinCount: 0,
      attendanceMarkedAt: null,
      attendanceSource: null,
      cancelledAt: null,
    },
    create: {
      sessionId: "seed_class_completed_attendance",
      userId: creditMember.id,
      status: ClassBookingStatus.booked,
      entitlementType: BookingEntitlementType.credit,
    },
  });

  await prisma.classAttendanceEvent.deleteMany({
    where: {
      sessionId: "seed_class_completed_attendance",
    },
  });

  const attendedBooking = await prisma.classBooking.findUniqueOrThrow({
    where: {
      sessionId_userId: {
        sessionId: "seed_class_completed_attendance",
        userId: unlimitedMember.id,
      },
    },
    select: {
      id: true,
    },
  });

  await prisma.classAttendanceEvent.createMany({
    data: [
      {
        sessionId: "seed_class_completed_attendance",
        bookingId: attendedBooking.id,
        userId: unlimitedMember.id,
        dailyParticipantId: "seed-daily-attendee",
        type: "joined",
        occurredAt: atUtcTime(datePlus(-1), 17, 2),
      },
      {
        sessionId: "seed_class_completed_attendance",
        bookingId: attendedBooking.id,
        userId: unlimitedMember.id,
        dailyParticipantId: "seed-daily-attendee",
        type: "left",
        occurredAt: atUtcTime(datePlus(-1), 17, 44),
      },
    ],
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
  await seedDeterministicClassScenarios();
  await seedThemedWeeks();

  console.log(
    "Seeded billing dataset: 25 members plus deterministic class timetable, cutoff, waitlist, attendance, and themed-week scenarios."
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
