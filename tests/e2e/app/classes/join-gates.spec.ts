import { expect, test } from "@playwright/test";
import { db } from "../../helpers/db";
import { loginWithEmail, makeE2eAuthEmail } from "../../helpers/auth";

async function seedMemberWithSession(email: string, startsAt: Date) {
  const user = await db.user.create({
    data: {
      email,
      firstName: "Jordan",
      lastName: "Member",
      isOnboarded: true,
    },
  });

  await db.userNotificationPreference.create({
    data: {
      userId: user.id,
      classReminders: true,
      scheduleUpdates: true,
      programAnnouncements: true,
      marketingEmails: false,
    },
  });

  await db.healthProfile.create({
    data: {
      userId: user.id,
    },
  });

  const instructor = await db.user.create({
    data: {
      email: makeE2eAuthEmail(`join-gates-instructor-${startsAt.getTime()}`),
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
      status: "scheduled",
      instructorUserId: instructor.id,
      instructorNameSnapshot: "Shruti Turner",
      roomSetupStatus: "ready",
      dailyRoomName: `join-gates-${user.id}`,
      dailyRoomUrl: `https://example.daily.co/join-gates-${user.id}`,
    },
  });

  await db.classBooking.create({
    data: {
      sessionId: session.id,
      userId: user.id,
      status: "booked",
    },
  });

  return { session };
}

test("member sees the too-early join state before the room opens", async ({ page }) => {
  const email = makeE2eAuthEmail("join-gates-early");
  const { session } = await seedMemberWithSession(email, new Date(Date.now() + 45 * 60 * 1000));

  await loginWithEmail(page, email);
  await page.goto(`/dashboard/classes/strength-foundations/join?sessionId=${session.id}`);

  await expect(page.getByRole("heading", { name: "The studio opens shortly" })).toBeVisible();
  await expect(
    page.getByText("You can join Strength Foundations 10 minutes before class starts.")
  ).toBeVisible();
});

test("member sees the too-late join state after the warm-up cutoff", async ({ page }) => {
  const email = makeE2eAuthEmail("join-gates-late");
  const { session } = await seedMemberWithSession(email, new Date(Date.now() - 10 * 60 * 1000));

  await loginWithEmail(page, email);
  await page.goto(`/dashboard/classes/strength-foundations/join?sessionId=${session.id}`);

  await expect(page.getByRole("heading", { name: "Warm-up has finished" })).toBeVisible();
  await expect(
    page.getByText("New joins close 5 minutes after class starts so nobody misses the warm-up.")
  ).toBeVisible();
});
