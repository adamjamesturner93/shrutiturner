import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { encode } from "next-auth/jwt";
import { db } from "../../helpers/db";
const uid = "workspace-navigation-test";
const id = "workspace-review";
const base = `/dashboard/programmes/${id}`;
const title = "Rebuilding Your Strength — Jan ’27";
const names = [
  "Start Where You Are",
  "Build The Foundations",
  "Build From There",
  "Adapt When Life Happens",
  "Keep Going",
];
const weeks = names.map((title, i) => ({
  id: `w${i + 1}`,
  number: i + 1,
  title,
  released: i < 3,
  releasesAt: new Date(Date.UTC(2027, 0, 25 + i * 7, 9)).toISOString(),
}));
const shell = {
  id,
  title,
  state: "active",
  staff: false,
  timezone: "Europe/London",
  startsAt: "2027-01-25T00:00:00Z",
  accessEndsAt: "2027-03-31T23:00:00Z",
  communityOpenAt: "2027-01-22T09:00:00Z",
  accessible: true,
  canExercise: true,
  canCommunity: true,
  clearanceStatus: "cleared",
  clearanceMessage: "Cleared for exercise",
  agreementsComplete: true,
  weeks,
  currentWeek: "w1",
  credit: null,
};
test.beforeAll(async () => {
  await db.user.upsert({
    where: { id: uid },
    create: {
      id: uid,
      email: "workspace.navigation@example.test",
      firstName: "Workspace",
      lastName: "Review",
      emailVerified: new Date("2026-01-01"),
      isOnboarded: true,
    },
    update: {},
  });
});
test.afterAll(async () => {
  await db.user.delete({ where: { id: uid } });
  await db.$disconnect();
});
async function setup(page: Page) {
  const origin = new URL(test.info().project.use.baseURL as string).origin;
  const token = await encode({
    token: {
      id: uid,
      sub: uid,
      email: "workspace.navigation@example.test",
      role: "student",
      name: "Workspace Review",
    },
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
  });
  await page
    .context()
    .addCookies([
      { name: "authjs.session-token", value: token, url: origin, httpOnly: true, sameSite: "Lax" },
    ]);
  const delays = new Map<string, number>();
  const requests: string[] = [];
  await page.route(`**/api/me/programmes/${id}/**`, async (route) => {
    const action = new URL(route.request().url()).pathname.split(`${id}/`)[1];
    requests.push(action);
    const delay = delays.get(action) || 0;
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    if (action === "shell") return route.fulfill({ json: shell });
    if (action.startsWith("sections/"))
      return route.fulfill({
        json: {
          introduction: "Your programme introduction",
          equipment: "A chair and resistance band",
          sessions: [],
          resources: [{ title: "Equipment guide", body: "Prepare your space." }],
          closingBody: "",
          closingVideoUrl: null,
        },
      });
    if (action === "community")
      return route.fulfill({ json: { posts: [], resources: [], staff: false, nextCursor: null } });
    const week = weeks.find((w) => action.startsWith(`weeks/${w.id}`));
    if (week && week.released)
      return route.fulfill({
        json: action.endsWith("/preview")
          ? { id: week.id, title: week.title }
          : {
              ...week,
              theme: `Education for ${week.title}`,
              education: `Released body for ${week.id}`,
              videoUrl: null,
              takeaways: ["Adapt to your starting point."],
              availability: "awaiting_teaching",
              canWorkout: false,
              canExercise: true,
              workout: [],
              reflection: "",
              live: null,
            },
      });
    return route.fulfill({ status: 403, json: { message: "Not released" } });
  });
  return { delays, requests };
}
async function ready(page: Page, path = "home") {
  await page.goto(`${base}/${path}`);
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  await expect(page.locator("[data-programme-content]")).toHaveAttribute("aria-busy", "false");
}
const tabs = (page: Page) => page.getByRole("navigation", { name: "Programme", exact: true });
test("persistent shell and delayed partial loading across all tabs", async ({ page }) => {
  const { delays, requests } = await setup(page);
  await ready(page);
  const initialShellRequests = requests.filter((r) => r === "shell").length;
  const header = await page.locator("[data-programme-header]").elementHandle();
  const sidebar = await page.locator("aside").first().elementHandle();
  const height = await page
    .locator("[data-programme-header]")
    .evaluate((el) => el.getBoundingClientRect().height);
  for (const label of ["Weeks", "Live", "Community", "Resources"]) {
    delays.set(`sections/${label.toLowerCase()}`, 950);
    await tabs(page).getByRole("link", { name: label, exact: true }).click();
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(page.locator("[data-programme-content] [role=status]")).toBeVisible();
    expect(await header!.evaluate((el) => el.isConnected)).toBe(true);
    expect(await sidebar!.evaluate((el) => el.isConnected)).toBe(true);
    expect(
      await page
        .locator("[data-programme-header]")
        .evaluate((el) => el.getBoundingClientRect().height)
    ).toBe(height);
    await expect(page.getByRole("heading", { name: "Your programme", exact: true })).toHaveCount(0);
    await expect(page.getByText("Loading programme…", { exact: true })).toHaveCount(0);
    await expect(page.locator("[data-programme-content]")).toHaveAttribute("aria-busy", "false");
  }
  expect(requests.filter((r) => r === "shell")).toHaveLength(initialShellRequests);
});
test("fast transitions, direct weeks, adjacent metadata and history", async ({ page }) => {
  const { requests } = await setup(page);
  await ready(page, "weeks/w1");
  await expect(page.getByRole("heading", { name: names[0], exact: true })).toBeVisible();
  await page.evaluate(() => {
    const region = document.querySelector("[data-programme-content]")!;
    region.setAttribute("data-skeleton-seen", "false");
    const observer = new MutationObserver(() => {
      if (region.querySelector("[role=status]")) region.setAttribute("data-skeleton-seen", "true");
    });
    observer.observe(region, { subtree: true, childList: true });
  });
  for (const number of [2, 3]) {
    await page
      .getByRole("navigation", { name: "Programme weeks", exact: true })
      .getByRole("link", { name: new RegExp(`Week ${number}`) })
      .click();
    await expect(page).toHaveURL(new RegExp(`/weeks/w${number}$`));
    await expect(page.getByRole("heading", { name: names[number - 1], exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: names[number - 1], exact: true })).toBeFocused();
  }
  await expect(page.locator("[data-programme-content]")).toHaveAttribute(
    "data-skeleton-seen",
    "false"
  );
  expect(requests).toContain("weeks/w2/preview");
  expect(requests.some((r) => r.includes("w4"))).toBe(false);
  await tabs(page).getByRole("link", { name: "Live", exact: true }).click();
  await expect(page).toHaveURL(/\/live$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/weeks\/w3$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/weeks\/w2$/);
});
test("locked weeks, previous/next, mobile and keyboard accessibility", async ({ page }) => {
  const { delays } = await setup(page);
  await ready(page, "weeks/w1");
  await expect(
    page
      .getByRole("navigation", { name: "Previous and next week" })
      .getByRole("link", { name: /Previous/ })
  ).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Previous and next week" })
    .getByRole("link", { name: /Next/ })
    .click();
  await expect(page).toHaveURL(/\/weeks\/w2$/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Week 2 of 5").selectOption("w3");
  await expect(page).toHaveURL(/\/weeks\/w3$/);
  await expect(
    page
      .getByRole("navigation", { name: "Previous and next week" })
      .getByRole("link", { name: /Next/ })
  ).toHaveCount(0);
  await expect(page.getByRole("option", { name: /Week 4/ })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "/tmp/rys-workspace-mobile.png", fullPage: true });
  const audit = await new AxeBuilder({ page })
    .include("[data-programme-content]")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  const live = tabs(page).getByRole("link", { name: "Live", exact: true });
  await live.focus();
  delays.set("sections/live", 950);
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-programme-content] [role=status]")).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).include("[data-programme-content]").analyze()).violations
  ).toEqual([]);
  await expect(page.getByRole("heading", { name: "Live workouts & recordings" })).toBeVisible();
  // Real server request bypasses the browser mocks: no entitlement grants no access.
  const denied = await page.request.get(
    "/api/me/programmes/demo-rebuilding-your-strength-2027/weeks/demo-rebuilding-your-strength-2027-week-4"
  );
  expect([403, 404]).toContain(denied.status());
});
