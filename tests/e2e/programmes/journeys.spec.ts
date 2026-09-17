import { test, expect, type Page } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { writeFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { db } from "../../helpers/db";
import { seedProgrammeFixtures } from "../../../prisma/fixtures/programmes";
import { signInAdminFixture } from "../helpers/admin-login";
const c = "rys-active-week1";
let users: Record<string, string>;
const clock = (iso: string) => writeFileSync("/tmp/rys-e2e-clock", iso);
async function login(page: Page, name: string) {
  const id = users[name];
  const role = name === "coach" ? "admin" : "student";
  const token = await encode({
    token: { id, sub: id, email: `${name}@example.test`, role, name },
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
  });
  await page.context().addCookies([
    {
      name: "authjs.session-token",
      value: token,
      url: "http://127.0.0.1:3711",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}
async function api(page: Page, path: string, body?: unknown) {
  return page.request.fetch(path, {
    method: body === undefined ? "GET" : "POST",
    ...(body === undefined ? {} : { data: body }),
  });
}
test.beforeAll(async () => {
  users = await seedProgrammeFixtures(db);
});
test.beforeEach(() => clock("2027-01-25T09:00:00Z"));
test.afterAll(async () => {
  await db.smallGroupProgramme.updateMany({
    where: { templateSlug: "rys-fixture" },
    data: { publicVisibility: "hidden" },
  });
  await db.$disconnect();
});
test("E2E-01 account-only login", async ({ page }) => {
  await signInAdminFixture(page, "alex.account@example.test", "/dashboard");
  const nav = page.getByRole("navigation", { name: "Studio", exact: true });
  await expect(nav.getByRole("link", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Account", exact: true })).toBeVisible();
  for (const name of ["Coaching", "Programmes", "Events"])
    await expect(nav.getByRole("link", { name, exact: true })).toHaveCount(0);
});
async function purchase(page: Page, email: string) {
  clock("2027-01-17T12:00:00Z");
  await db.smallGroupProgramme.update({
    where: { id: "rys-on-sale" },
    data: { publicVisibility: "listed" },
  });
  await page.goto("/programmes/rys-on-sale");
  await page.getByLabel("Your name", { exact: true }).fill("Synthetic New Participant");
  await page.getByLabel("Your email", { exact: true }).fill(email);
  await page.getByLabel("I agree to the programme terms", { exact: false }).check();
  await page.getByLabel("I understand health screening", { exact: false }).check();
  await page.getByRole("button", { name: "Continue to secure checkout" }).click();
  await page.getByRole("button", { name: "Pay synthetic purchase" }).click();
  await expect(page.getByRole("heading", { name: /You're in/ })).toBeVisible();
}
test("E2E-02 new-account purchase and onboarding", async ({ page }) => {
  const email = "new.purchase@example.test";
  await db.smallGroupProgrammeEnrollment.deleteMany({ where: { attendeeEmail: email } });
  await db.user.deleteMany({ where: { email } });
  await purchase(page, email);
  const u = await db.user.findUniqueOrThrow({ where: { email } });
  expect(u.emailVerified).toBeNull();
  await signInAdminFixture(page, email, "/dashboard");
  await page.goto("/dashboard/programmes/rys-on-sale/onboarding");
  await expect(page.getByRole("heading", { name: "Onboarding", exact: true })).toBeVisible();
  expect(
    await db.smallGroupProgrammeEnrollment.count({
      where: { userId: u.id, programmeId: "rys-on-sale" },
    })
  ).toBe(1);
});
test("E2E-03 existing account reused", async ({ page }) => {
  await login(page, "alex.account");
  await db.smallGroupProgrammeEnrollment.deleteMany({
    where: { userId: users["alex.account"], programmeId: "rys-on-sale" },
  });
  await purchase(page, "alex.account@example.test");
  expect(await db.user.count({ where: { email: "alex.account@example.test" } })).toBe(1);
  expect(
    (
      await db.smallGroupProgrammeEnrollment.findFirstOrThrow({
        where: { attendeeEmail: "alex.account@example.test", programmeId: "rys-on-sale" },
      })
    ).userId
  ).toBe(users["alex.account"]);
});
test("E2E-04 all-entitlements navigation", async ({ page }) => {
  await login(page, "avery.everything");
  await page.goto("/dashboard");
  const nav = page.getByRole("navigation", { name: "Studio", exact: true });
  for (const name of ["Dashboard", "Coaching", "Programmes", "Events", "Account"])
    await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
  for (const name of ["Small Groups", "Retreats", "Workshops"])
    await expect(nav.getByRole("link", { name, exact: true })).toHaveCount(0);
});
test("E2E-05 incomplete health permits only education", async ({ page }) => {
  await login(page, "jamie.health");
  await page.goto(`/dashboard/programmes/${c}/weeks/${c}-w1`);
  await expect(page.getByRole("heading", { name: "What Strength Means Here" })).toBeVisible();
  await expect(page.getByText("Complete your health check before training.").first()).toBeVisible();
  await expect(page.getByText("Box squat — 3 x 8")).toHaveCount(0);
  expect((await api(page, `/api/me/programmes/${c}/live/${c}-s1`, {})).status()).toBe(403);
});
test("E2E-06 pending coach review is a waiting state", async ({ page }) => {
  await login(page, "morgan.review");
  await page.goto(`/dashboard/programmes/${c}/weeks/${c}-w1`);
  await expect(page.getByRole("heading", { name: "What Strength Means Here" })).toBeVisible();
  await expect(
    page.getByText("Your health information is waiting for review.").first()
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Complete onboarding" })).toHaveCount(0);
});
test("E2E-07 coach clears without another purchase", async ({ page }) => {
  const row = await db.offeringClearance.findUniqueOrThrow({
    where: {
      userId_offeringKey: { userId: users["morgan.review"], offeringKey: `programme:${c}` },
    },
  });
  await login(page, "coach");
  await page.goto(`/admin/programmes/${c}`);
  const review = page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: "Morgan Review", exact: true }) });
  await review.getByText("Individual health review for Morgan Review", { exact: true }).click();
  await review.getByRole("button", { name: "Save individual clearance" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Cleared" })).toBeVisible();
  await login(page, "morgan.review");
  const response = await api(page, `/api/me/programmes/${c}`);
  expect((await response.json()).canExercise).toBe(true);
  await db.offeringClearance.update({ where: { id: row.id }, data: { status: "pending_review" } });
});
test("E2E-08 future-week UI and API protection", async ({ page }) => {
  await login(page, "priya.programme");
  await page.goto(`/dashboard/programmes/${c}/weeks`);
  const futureWeek = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Build From There", exact: true }) });
  await expect(futureWeek.getByText("Coming up", { exact: true })).toBeVisible();
  await expect(futureWeek.getByRole("link", { name: "Open week" })).toHaveCount(0);
  const response = await api(page, `/api/me/programmes/${c}/weeks/${c}-w3`);
  expect(response.status()).toBe(403);
  expect(await response.text()).not.toContain("Week 3 education");
});
test("E2E-09 rejects exercise without teaching evidence", async ({ page }) => {
  await login(page, "coach");
  const w = await db.programmeWeek.findUniqueOrThrow({ where: { id: `${c}-w1` } });
  const r = await api(page, `/api/admin/programmes/cohorts/${c}/weeks/${w.id}`, {
    ...w,
    releasesAt: w.releasesAt.toISOString(),
    reflectionAt: w.reflectionAt.toISOString(),
    workoutJson: [
      { key: "novel", name: "Novel Exercise Without Demonstration", prescription: "3 x 8" },
    ],
    workoutPublished: true,
  });
  expect(r.status()).toBe(400);
  expect(await r.text()).toContain("EXERCISE_WITHOUT_DEMONSTRATION");
});
test("E2E-10 live token requires clearance", async ({ page }) => {
  clock("2027-01-27T18:30:00Z");
  await login(page, "priya.programme");
  await page.goto(`/dashboard/programmes/${c}/live`);
  await expect(page.getByRole("button", { name: "Join live session" })).toBeVisible();
  expect((await api(page, `/api/me/programmes/${c}/live/${c}-s1`, {})).ok()).toBe(true);
  await login(page, "jamie.health");
  expect((await api(page, `/api/me/programmes/${c}/live/${c}-s1`, {})).status()).toBe(403);
});
test("E2E-11 direct replay authorisation", async ({ page }) => {
  clock("2027-03-01T09:00:00Z");
  const path = "/api/me/programmes/rys-follow-up/replays/rys-follow-up-s1-replay";
  await login(page, "priya.programme");
  expect((await api(page, path)).ok()).toBe(true);
  await login(page, "jamie.health");
  expect((await api(page, path)).status()).toBe(403);
  await login(page, "casey.coaching");
  expect((await api(page, path)).status()).toBe(404);
});
test("E2E-12 community closed before configured opening", async ({ page }) => {
  clock("2027-01-21T09:00:00Z");
  await login(page, "priya.programme");
  await page.goto(`/dashboard/programmes/${c}/community`);
  await expect(page.getByText(/Community opens/)).toBeVisible();
  expect((await api(page, `/api/me/programmes/${c}/community`)).status()).toBe(403);
});
test("E2E-13 participant text post reply edit delete", async ({ page }) => {
  await login(page, "priya.programme");
  await page.goto(`/dashboard/programmes/${c}/community`);
  await page.getByLabel("Post title", { exact: true }).fill("Synthetic browser question");
  await page.getByLabel("Your post", { exact: true }).fill("Question from a participant");
  await page.getByRole("button", { name: "Post to community" }).click();
  const article = page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: "Synthetic browser question" }) });
  await expect(article).toBeVisible();
  await article.getByLabel("Reply to Synthetic browser question").fill("A reply");
  await article.getByRole("button", { name: "Reply", exact: true }).click();
  await expect(article.locator("p").filter({ hasText: /^A reply$/ })).toBeVisible();
  await article.getByText("Edit post", { exact: true }).click();
  await article.getByLabel("Updated post").fill("Updated question");
  await article.getByRole("button", { name: "Save post" }).click();
  await expect(article.locator("p").filter({ hasText: /^Updated question$/ })).toBeVisible();
  await article.getByRole("button", { name: "Delete post" }).click();
  await expect(page.getByRole("heading", { name: "Synthetic browser question" })).toHaveCount(0);
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
});
test("E2E-14 coach pin lock moderate", async ({ page }) => {
  await login(page, "coach");
  const result = await api(page, `/api/me/programmes/${c}/community`, {
    title: "Coach announcement",
    body: "Synthetic guidance",
  });
  const { id } = await result.json();
  expect((await api(page, `/api/me/programmes/${c}/community/${id}`, { action: "pin" })).ok()).toBe(
    true
  );
  expect(
    (await api(page, `/api/me/programmes/${c}/community/${id}`, { action: "lock" })).ok()
  ).toBe(true);
  await login(page, "priya.programme");
  expect(
    (await api(page, `/api/me/programmes/${c}/community/${id}`, { action: "pin" })).status()
  ).toBe(403);
  expect(
    (await api(page, `/api/me/programmes/${c}/community`, { parentId: id, body: "Reply" })).ok()
  ).toBe(false);
});
test("E2E-15 community does not bypass exercise authorisation", async ({ page }) => {
  clock("2027-03-01T09:00:00Z");
  await login(page, "coach");
  expect(
    (
      await api(page, "/api/me/programmes/rys-follow-up/community", {
        title: "Workout resource",
        body: "See your workout",
        resourceIds: ["rys-follow-up-s1-replay"],
      })
    ).ok()
  ).toBe(true);
  await login(page, "jamie.health");
  const community = await api(page, "/api/me/programmes/rys-follow-up/community");
  expect(community.ok()).toBe(true);
  expect(await community.text()).not.toContain("rys-follow-up-s1-replay");
  expect(
    (await api(page, "/api/me/programmes/rys-follow-up/replays/rys-follow-up-s1-replay")).status()
  ).toBe(403);
});
async function jobs(page: Page) {
  return page.request.post("/api/internal/jobs/programme_maintenance", {
    headers: { Authorization: "Bearer programme-fixture-job-secret" },
  });
}
test("E2E-16 scheduled Friday prompt after live coaching ends", async ({ page }) => {
  clock("2027-02-26T09:00:00Z");
  expect((await jobs(page)).ok()).toBe(true);
  await login(page, "priya.programme");
  await page.goto(`/dashboard/programmes/${c}/community`);
  await expect(
    page.getByText("What are you taking forward from these five weeks?", { exact: true })
  ).toBeVisible();
});
test("E2E-17 follow-up retains old content only", async ({ page }) => {
  clock("2027-03-01T09:00:00Z");
  await login(page, "priya.programme");
  await page.goto("/dashboard/programmes/rys-follow-up/home");
  await expect(
    page.getByRole("heading", { name: "Your five coached weeks are complete." })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "What Next?" })).toBeVisible();
  await expect(page.getByText("Box squat — 3 x 8")).toBeVisible();
  await expect(page.getByRole("button", { name: "Join live session" })).toHaveCount(0);
});
test("E2E-18 expiry at London midnight preserves history", async ({ page }) => {
  clock("2027-03-31T23:00:00Z");
  await login(page, "priya.programme");
  await page.goto("/dashboard/programmes/rys-follow-up");
  await expect(page.getByRole("heading", { name: "Programme history" })).toBeVisible();
  expect(
    (await api(page, "/api/me/programmes/rys-follow-up/replays/rys-follow-up-s1-replay")).status()
  ).toBe(403);
  expect((await api(page, "/api/me/programmes/rys-follow-up/community")).status()).toBe(403);
});
test("E2E-19 below minimum requires an admin decision", async ({ page }) => {
  clock("2027-01-18T10:00:00Z");
  await login(page, "coach");
  await page.goto("/admin/programmes/rys-below-minimum");
  const paid = page.getByRole("group", { name: "Paid participants", exact: true });
  await expect(paid.getByText("3", { exact: true })).toBeVisible();
  await expect(paid.getByText("Minimum 4", { exact: true })).toBeVisible();
  await expect(page.getByText(/Confirmation decision due/)).toBeVisible();
  await page.getByRole("button", { name: "Confirm cohort", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
  expect(
    (await db.smallGroupProgramme.findUniqueOrThrow({ where: { id: "rys-below-minimum" } }))
      .confirmedAt
  ).not.toBeNull();
});
test("E2E-20 cancellation suppresses access and surfaces refunds", async ({ page }) => {
  await login(page, "coach");
  expect(
    (
      await api(page, "/api/admin/programmes/cohorts/rys-pre-start/cancel", {
        reason: "Synthetic cancellation",
      })
    ).ok()
  ).toBe(true);
  await page.goto("/admin/programmes/rys-pre-start");
  await expect(page.getByText("Refund: pending").first()).toBeVisible();
  await login(page, "priya.programme");
  expect((await api(page, "/api/me/programmes/rys-pre-start/community")).status()).toBe(403);
  await jobs(page);
  expect(
    await db.programmeMessage.count({
      where: { programmeId: "rys-pre-start", kind: "prestart", sentAt: null },
    })
  ).toBe(0);
});
test("E2E-21 alumni credit is manual and one-use", async ({ page }) => {
  clock("2027-03-01T09:00:00Z");
  await db.smallGroupProgramme.update({
    where: { id: "rys-follow-up" },
    data: {
      creditActive: true,
      creditAmountPence: 2500,
      creditStartsAt: new Date("2027-02-27"),
      creditEndsAt: new Date("2027-04-01"),
      creditServices: ["coached_plan"],
    },
  });
  const eid = "rys-follow-up-priya.programme";
  await db.smallGroupProgrammeEnrollment.update({
    where: { id: eid },
    data: { creditRedeemedAt: null },
  });
  await login(page, "priya.programme");
  await page.goto("/dashboard/programmes/rys-follow-up");
  await expect(page.getByRole("heading", { name: "Your alumni coaching credit" })).toBeVisible();
  await login(page, "coach");
  const path = `/api/admin/programmes/cohorts/rys-follow-up/credit/${eid}`;
  expect((await api(page, path, { reference: "Synthetic coaching reference" })).ok()).toBe(true);
  expect((await api(page, path, { reference: "second" })).ok()).toBe(false);
  expect(
    (await db.smallGroupProgramme.findUniqueOrThrow({ where: { id: "rys-follow-up" } }))
      .salePricePence
  ).toBe(10000);
});
test("E2E-22 purchaser cannot access participant health or portal", async ({ page }) => {
  await login(page, "pat.purchaser");
  expect((await api(page, `/api/me/programmes/${c}`)).status()).toBe(404);
  expect((await api(page, `/api/me/programmes/${c}/onboarding`)).status()).toBe(404);
  await login(page, "gift.participant");
  expect((await api(page, `/api/me/programmes/${c}/onboarding`)).ok()).toBe(true);
});
test("E2E-23 mobile entitlement navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await db.smallGroupProgrammeEnrollment.deleteMany({ where: { userId: users["alex.account"] } });
  for (const name of ["alex.account", "avery.everything"]) {
    await login(page, name);
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Open studio menu" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("link", { name: "Account", exact: true })).toBeVisible();
    if (name === "avery.everything") {
      for (const label of ["Coaching", "Programmes", "Events"])
        await expect(dialog.getByRole("link", { name: label, exact: true })).toBeVisible();
    } else
      for (const label of ["Coaching", "Programmes", "Events"])
        await expect(dialog.getByRole("link", { name: label, exact: true })).toHaveCount(0);
    await page.keyboard.press("Escape");
  }
});
test("E2E-24 independent workout release after teaching without attendance", async ({ page }) => {
  const id = "rys-teaching";
  await db.smallGroupProgrammeSession.update({
    where: { id: `${id}-s1` },
    data: { taughtAt: null, status: "scheduled" },
  });
  await login(page, "priya.programme");
  await page.goto(`/dashboard/programmes/${id}/weeks/${id}-w1`);
  await expect(page.getByRole("heading", { name: "What Strength Means Here" })).toBeVisible();
  await expect(
    page.getByText("Your independent workout will be available after this week's live session.")
  ).toBeVisible();
  clock("2027-01-27T19:20:00Z");
  await login(page, "coach");
  expect((await api(page, `/api/admin/programmes/cohorts/${id}/teaching/${id}-s1`, {})).ok()).toBe(
    true
  );
  await db.replayAsset.upsert({
    where: { id: "rys-teaching-replay" },
    create: {
      id: "rys-teaching-replay",
      resourceType: "small_group_programme_session",
      smallGroupProgrammeId: id,
      smallGroupProgrammeSessionId: `${id}-s1`,
      dailyRecordingId: "fixture-teaching",
      status: "ready",
    },
    update: { status: "ready" },
  });
  await login(page, "priya.programme");
  await page.reload();
  await expect(page.getByText("Box squat — 3 x 8")).toBeVisible();
  expect(
    (
      await db.smallGroupProgrammeEnrollment.findUniqueOrThrow({
        where: { id: `${id}-priya.programme` },
      })
    ).sessionsAttended
  ).toBe(0);
  const reference = await api(page, `/api/me/programmes/${id}/replays/rys-teaching-replay`);
  expect(reference.ok()).toBe(true);
  expect((await reference.json()).url).toContain("fixture.mp4");
  await login(page, "jamie.health");
  await page.reload();
  await expect(page.getByText("Box squat — 3 x 8")).toHaveCount(0);
  expect((await api(page, `/api/me/programmes/${id}/replays/rys-teaching-replay`)).status()).toBe(
    403
  );
});
test("Core participant pages meet axe WCAG checks", async ({ page }) => {
  await login(page, "priya.programme");
  for (const path of [
    "/dashboard",
    `/dashboard/programmes/${c}/home`,
    `/dashboard/programmes/${c}/weeks/${c}-w1`,
    `/dashboard/programmes/${c}/onboarding`,
    `/dashboard/programmes/${c}/community`,
    `/dashboard/programmes/${c}/live`,
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Loading programme…")).toHaveCount(0);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      path
    ).toEqual([]);
  }
});

test("UX-01 programme-led discovery, date choices and private fixtures", async ({ page }) => {
  clock("2027-01-17T12:00:00Z");
  await db.smallGroupProgramme.updateMany({
    where: { templateSlug: "rys-fixture" },
    data: { publicVisibility: "hidden" },
  });
  await page.goto("/programmes");
  await expect(page.getByText("No programmes are currently open for booking.")).toBeVisible();
  await page.goto("/programmes/rys-active-week3");
  await expect(page.getByRole("heading", { name: "404", exact: true })).toBeVisible();
  await expect(page.getByLabel("Your name", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("Rebuilding Your Strength — active-week3", { exact: true })
  ).toHaveCount(0);
  await db.smallGroupProgramme.update({
    where: { id: "rys-on-sale" },
    data: {
      publicVisibility: "listed",
      cohortState: "on_sale",
      confirmedAt: null,
      enrolmentOpen: true,
      maximumParticipants: 100,
    },
  });
  await db.smallGroupProgramme.update({
    where: { id: "rys-draft" },
    data: {
      publicVisibility: "coming_soon",
      startDate: new Date("2027-03-01"),
      structuredProgrammeEndsAt: new Date("2027-04-03"),
    },
  });
  await page.goto("/programmes");
  await expect(page.locator("article")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Find out more" })).toHaveCount(1);
  for (const text of ["on-sale", "pre-start", "active-week1", "below-minimum", "teaching"])
    await expect(page.getByText(text, { exact: true })).toHaveCount(0);
  await page.screenshot({ path: "/tmp/rys-ux-catalogue-desktop.png", fullPage: true });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations
  ).toEqual([]);
  await page.getByRole("link", { name: "Find out more" }).click();
  await expect(page.getByLabel("Your name", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();
  await page.screenshot({ path: "/tmp/rys-ux-sales-desktop.png", fullPage: true });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations
  ).toEqual([]);
  await page
    .getByRole("navigation", { name: "Choose programme dates" })
    .getByRole("link", { name: /Coming soon/ })
    .click();
  await expect(page.getByLabel("Your name", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Join the mailing list" })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "/tmp/rys-ux-sales-mobile.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
  await db.smallGroupProgramme.update({
    where: { id: "rys-on-sale" },
    data: { confirmedAt: new Date("2027-01-18") },
  });
  clock("2027-01-25T09:00:00Z");
  await page.goto("/programmes/rys-on-sale");
  await expect(page.getByText("This cohort is underway.", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Your name", { exact: true })).toHaveCount(0);
  await page.goto("/programmes");
  await expect(page.locator("article")).toHaveCount(1);
  await expect(page.locator("article").getByText("Coming soon", { exact: true })).toBeVisible();
});

test("UX-02 one event action and grouped bookings with meaningful cards", async ({ page }) => {
  const original = await db.retreatBooking.findUniqueOrThrow({
    where: { id: "rys-event-retreat-drew.events" },
  });
  const { id: unusedId, createdAt: unusedCreated, updatedAt: unusedUpdated, ...copy } = original;
  void unusedId;
  void unusedCreated;
  void unusedUpdated;
  await db.retreatBooking.deleteMany({ where: { id: "rys-ux-browser-booking" } });
  await db.retreatBooking.create({
    data: {
      ...copy,
      id: "rys-ux-browser-booking",
      stripeDepositSessionId: null,
      stripeBalanceSessionId: null,
      balancePaymentUrlToken: null,
      complianceSnapshotJson: undefined,
      paymentPlanSnapshotJson: undefined,
      refundPolicySnapshotJson: undefined,
      bookingStatus: "deposit_paid",
      paymentStatus: "deposit_paid",
      balanceAmountPence: 5000,
      balancePaidPence: 0,
      balanceDueAt: new Date("2027-06-01"),
    },
  });
  clock("2027-06-08T12:00:00Z");
  try {
    await login(page, "drew.events");
    await page.goto("/dashboard");
    const next = page.getByRole("region", { name: "Next up" });
    await expect(next.getByRole("heading", { name: "Stirling Retreat" })).toHaveCount(1);
    await expect(next.getByRole("link", { name: "Pay balance", exact: true })).toBeVisible();
    await page.goto("/dashboard/events");
    await expect(page.getByRole("article", { name: "Stirling Retreat" })).toHaveCount(1);
    await expect(page.getByText("2 attendees · 2 bookings")).toBeVisible();
    await page.screenshot({ path: "/tmp/rys-ux-events-desktop.png", fullPage: true });
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations
    ).toEqual([]);
    await page.getByRole("link", { name: "Manage bookings", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Your bookings" })).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(2);
  } finally {
    await db.retreatBooking.delete({ where: { id: "rys-ux-browser-booking" } });
  }
});

test("UX-03 public bridge and distinct discovery on desktop and mobile", async ({ page }) => {
  await login(page, "avery.everything");
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: "Visit website", exact: true })).toHaveAttribute(
    "href",
    "/"
  );
  const explore = page.getByRole("region", { name: "See what's coming up" });
  await expect(explore.getByRole("link", { name: "Programmes", exact: true })).toHaveAttribute(
    "href",
    "/programmes"
  );
  await expect(explore.getByRole("link", { name: "Retreats & Workshops" })).toHaveAttribute(
    "href",
    "/retreats"
  );
  await page.screenshot({ path: "/tmp/rys-ux-dashboard-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open studio menu" }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByRole("link", { name: "Visit website" })).toHaveAttribute("href", "/");
  await expect(drawer.getByRole("link", { name: "Shruti Turner" })).toHaveAttribute("href", "/");
  await drawer.getByRole("link", { name: "Visit website" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/dashboard");
  await page.screenshot({ path: "/tmp/rys-ux-dashboard-mobile.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
});

test("UX-04 programme and admin journeys have usable mobile hierarchy", async ({ page }) => {
  await login(page, "priya.programme");
  await page.goto(`/dashboard/programmes/${c}/weeks`);
  await expect(
    page
      .getByRole("navigation", { name: "Programme", exact: true })
      .getByRole("link", { name: "Weeks", exact: true })
  ).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Open week", exact: true })).toHaveCount(1);
  await page.screenshot({ path: "/tmp/rys-journey-weeks.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/dashboard/programmes/${c}/home`);
  await expect(
    page.getByRole("heading", { name: "Start Where You Are", exact: true, level: 2 })
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
  await page.screenshot({ path: "/tmp/rys-journey-home-mobile.png", fullPage: true });
  await login(page, "coach");
  await page.goto(`/admin/programmes/${c}`);
  await expect(page.getByRole("navigation", { name: "Cohort sections" })).toBeVisible();
  await page.getByRole("link", { name: "Settings & dates", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save settings", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual(
    []
  );
  await page.screenshot({ path: "/tmp/rys-journey-admin-mobile.png", fullPage: true });
});

test("UX-05 community keeps a draft when saving fails", async ({ page }) => {
  await login(page, "priya.programme");
  await page.goto(`/dashboard/programmes/${c}/community`);
  await page.getByLabel("Post title", { exact: true }).fill("Keep my draft");
  await page.getByLabel("Your post", { exact: true }).fill("My unsaved question");
  await page.route(`**/api/me/programmes/${c}/community`, async (route) => {
    if (route.request().method() === "POST")
      await route.fulfill({ status: 503, json: { message: "Please try again" } });
    else await route.continue();
  });
  await page.getByRole("button", { name: "Post to community", exact: true }).click();
  await expect(page.getByText("Please try again", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Your post", { exact: true })).toHaveValue("My unsaved question");
});
