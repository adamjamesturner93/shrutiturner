import { expect, test } from "@playwright/test";
import { db } from "@/lib/db";
import {
  CURRENT_HEALTH_DATA_CONSENT_VERSION,
  CURRENT_HEALTH_WAIVER_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/data/legal-documents";
import { loginWithEmail, makeE2eAuthEmail } from "../helpers/auth";
import { formatAxeViolations, getAxeViolations, waitForPageToSettle } from "../helpers/a11y";

async function seedCompleteMember(email: string) {
  const user = await db.user.create({
    data: {
      email,
      firstName: "Avery",
      lastName: "Accessible",
      dob: new Date("1990-05-19"),
      heardAboutSource: "google",
      isOnboarded: true,
      acceptedTermsVersion: CURRENT_TERMS_VERSION,
      acceptedHealthWaiverVersion: CURRENT_HEALTH_WAIVER_VERSION,
      hasConsentedToHealthData: true,
      acceptedHealthDataConsentVersion: CURRENT_HEALTH_DATA_CONSENT_VERSION,
    },
  });

  await db.healthProfile.create({
    data: {
      userId: user.id,
    },
  });

  await db.userNotificationPreference.create({
    data: {
      userId: user.id,
      classReminders: true,
      scheduleUpdates: true,
      programAnnouncements: true,
      marketingEmails: true,
    },
  });

  return user;
}

async function seedAccessibleSession(userId: string, startsAt: Date) {
  const instructor = await db.user.create({
    data: {
      email: makeE2eAuthEmail("a11y-instructor"),
      firstName: "Shruti",
      lastName: "Turner",
      role: "admin",
    },
  });

  const session = await db.classSession.create({
    data: {
      classDefinitionSlug: "strength-foundations",
      titleSnapshot: "Strength Foundations",
      typeSnapshot: "Strength",
      levelSnapshot: "Adaptive",
      durationMinutes: 45,
      startsAtUtc: startsAt,
      endsAtUtc: new Date(startsAt.getTime() + 45 * 60 * 1000),
      timezone: "Europe/London",
      capacity: 10,
      instructorUserId: instructor.id,
      instructorNameSnapshot: "Shruti Turner",
      roomSetupStatus: "ready",
      dailyRoomName: `a11y-room-${userId}`,
      dailyRoomUrl: `https://example.daily.co/a11y-room-${userId}`,
    },
  });

  await db.classBooking.create({
    data: {
      sessionId: session.id,
      userId,
      status: "booked",
    },
  });

  return session;
}

async function seedAdminAccessData(email: string) {
  const admin = await db.user.create({
    data: {
      email,
      firstName: "Ada",
      lastName: "Admin",
      role: "admin",
      isOnboarded: true,
    },
  });

  const member = await db.user.create({
    data: {
      email: makeE2eAuthEmail("a11y-admin-member"),
      firstName: "Mina",
      lastName: "Member",
      isOnboarded: true,
    },
  });

  const session = await db.classSession.create({
    data: {
      classDefinitionSlug: "strength-foundations",
      titleSnapshot: "Strength Foundations",
      typeSnapshot: "Strength",
      levelSnapshot: "Adaptive",
      durationMinutes: 45,
      startsAtUtc: new Date(Date.now() + 2 * 60 * 60 * 1000),
      endsAtUtc: new Date(Date.now() + 3 * 60 * 60 * 1000),
      timezone: "Europe/London",
      capacity: 10,
      instructorUserId: admin.id,
      instructorNameSnapshot: "Ada Admin",
    },
  });

  return { admin, member, session };
}

test("signed-in account, membership, and health routes do not introduce axe violations", async ({
  page,
}) => {
  const email = makeE2eAuthEmail("a11y-member");
  const user = await seedCompleteMember(email);
  const session = await seedAccessibleSession(user.id, new Date(Date.now() + 5 * 60 * 1000));
  await loginWithEmail(page, email);

  for (const route of [
    "/dashboard/account",
    "/dashboard/membership",
    "/dashboard/health",
    "/dashboard/schedule",
    `/dashboard/classes/strength-foundations?sessionId=${encodeURIComponent(session.id)}`,
    `/dashboard/classes/strength-foundations/join?sessionId=${encodeURIComponent(session.id)}`,
  ]) {
    await page.goto(route);
    await waitForPageToSettle(page);
    const violations = await getAxeViolations(page);
    expect(violations, formatAxeViolations(route, violations)).toEqual([]);
  }
});

test("onboarding modal remains accessible while a member finishes setup", async ({ page }) => {
  const email = makeE2eAuthEmail("a11y-onboarding");
  await db.user.create({
    data: {
      email,
    },
  });

  await loginWithEmail(page, email);
  await page.goto("/dashboard?onboarding=true");
  await expect(page.getByRole("heading", { name: "Complete Your Profile" })).toBeVisible();

  await waitForPageToSettle(page);
  const violations = await getAxeViolations(page);
  expect(violations, formatAxeViolations("/dashboard?onboarding=true", violations)).toEqual([]);
});

test("dashboard join gate screens do not introduce axe violations", async ({ page }) => {
  const email = makeE2eAuthEmail("a11y-join-gates");
  const user = await seedCompleteMember(email);
  const earlySession = await seedAccessibleSession(user.id, new Date(Date.now() + 45 * 60 * 1000));
  const lateSession = await seedAccessibleSession(user.id, new Date(Date.now() - 10 * 60 * 1000));

  await loginWithEmail(page, email);

  for (const route of [
    `/dashboard/classes/strength-foundations/join?sessionId=${encodeURIComponent(earlySession.id)}`,
    `/dashboard/classes/strength-foundations/join?sessionId=${encodeURIComponent(lateSession.id)}`,
  ]) {
    await page.goto(route);
    await waitForPageToSettle(page);
    const violations = await getAxeViolations(page);
    expect(violations, formatAxeViolations(route, violations)).toEqual([]);
  }
});

test("admin member and class routes do not introduce axe violations", async ({ page }) => {
  const email = makeE2eAuthEmail("a11y-admin");
  const { member, session } = await seedAdminAccessData(email);

  await loginWithEmail(page, email, "123456", /\/admin(?:\/|$)/);

  for (const route of [
    "/admin/members",
    `/admin/members/${member.id}`,
    "/admin/classes",
    `/admin/classes/${session.id}`,
  ]) {
    await page.goto(route);
    await waitForPageToSettle(page);
    const violations = await getAxeViolations(page);
    expect(violations, formatAxeViolations(route, violations)).toEqual([]);
  }
});
