import { expect, test } from "@playwright/test";
import { cleanupE2eThemedWeeks, createE2eThemedWeek } from "../../helpers/themed-weeks";

test.beforeEach(async () => {
  await cleanupE2eThemedWeeks();
});

test("home page shows the updated hero and coaching philosophy section", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Understand Your Body. Build Sustainable Strength." })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Explore Move Well Classes" }).first()
  ).toHaveAttribute("href", "/classes");
  await expect(page.getByRole("heading", { name: "My Coaching Philosophy" })).toBeVisible();
  await expect(page.getByText("Understanding · Movement · Strength")).toBeVisible();
});

test("classes page shows the updated hero and yoga plus strength section", async ({ page }) => {
  await createE2eThemedWeek({
    label: "classes",
    title: "Pelvic Floor Health Week",
    shortDescription: "Focused class support for pelvic floor confidence.",
    audience: "Anyone needing pelvic floor-aware cueing.",
    ctaHref: "/classes",
    ctaLabel: "Register",
    startDate: "2026-03-23T00:00:00.000Z",
    endDate: "2026-03-29T23:59:59.999Z",
  });

  await page.goto("/classes");

  await expect(page.getByRole("heading", { name: "Move Well Classes" })).toBeVisible();
  await expect(
    page.getByText(
      "Live online classes combining adaptive yoga and intelligent strength training."
    )
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Why Yoga + Strength?" })).toBeVisible();
  await expect(page.getByText("Awareness Before Load")).toBeVisible();
  await expect(page.getByText("Pelvic Floor Health Week")).toBeVisible();
});

test("schedule page shows the next themed week banner", async ({ page }) => {
  const today = new Date();
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 1);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setUTCDate(end.getUTCDate() + 5);
  end.setUTCHours(23, 59, 59, 999);

  await createE2eThemedWeek({
    label: "schedule",
    title: "Pelvic Floor Health Week",
    shortDescription:
      "All your regular classes this week will incorporate pelvic floor-aware cueing.",
    audience: "Anyone needing pelvic floor-aware cueing.",
    ctaHref: "/classes",
    ctaLabel: "Register",
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    sortOrder: -100,
  });

  await page.goto("/schedule");

  await expect(page.getByRole("heading", { name: "Class Schedule" })).toBeVisible();
  await expect(page.getByText("Pelvic Floor Health Week")).toBeVisible();
  await expect(page.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/classes");
});

test("class detail page renders upcoming sessions and booking CTAs", async ({ page }) => {
  await page.route("**/api/classes/sessions?slug=weekend-yoga-flow", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "sess-1",
          startsAtUtc: "2026-03-21T10:00:00.000Z",
          durationMinutes: 60,
          spotsRemaining: 6,
          capacity: 15,
          instructorName: "Shruti Turner",
          instructorBio: "Coach bio",
        },
        {
          id: "sess-2",
          startsAtUtc: "2026-03-28T10:00:00.000Z",
          durationMinutes: 60,
          spotsRemaining: 15,
          capacity: 15,
          instructorName: "Shruti Turner",
          instructorBio: "Coach bio",
        },
      ]),
    });
  });

  await page.goto("/schedule/weekend-yoga-flow");

  await expect(page.getByRole("heading", { name: "Weekend Yoga Flow" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Upcoming Sessions" })).toBeVisible();
  await expect(page.getByText("6 of 15 spots left")).toBeVisible();
  await expect(page.getByText("15 of 15 spots left")).toBeVisible();
  await expect(page.getByRole("button", { name: /Book 21 March 2026|Book Class/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "View All Dates" })).toHaveAttribute(
    "href",
    "/schedule"
  );
});
