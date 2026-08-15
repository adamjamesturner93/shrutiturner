import { expect, test } from "@playwright/test";
import { cleanupE2eThemedWeeks, createE2eThemedWeek } from "../../helpers/themed-weeks";

test.beforeEach(async () => {
  await cleanupE2eThemedWeeks();
});

test("home page shows the updated hero and working philosophy section", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /Movement that works with your body, not against it\./i,
    })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore 1:1 Offers" }).first()).toHaveAttribute(
    "href",
    "/coaching"
  );
  await expect(page.getByText("The working philosophy")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Understand first" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Build strength" })).toBeVisible();
});

test("classes page shows the updated hero and yoga plus strength section", async ({ page }) => {
  await page.goto("/classes");

  await expect(
    page.getByRole("heading", { name: "Live classes for people who need nuance, not noise." })
  ).toBeVisible();
  await expect(
    page.getByText("Adaptive yoga and intelligent strength training taught live online.")
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "These disciplines support each other." })
  ).toBeVisible();
  await expect(page.getByText("Awareness before load")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Choose the doorway that feels most useful right now." })
  ).toBeVisible();
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

  await expect(
    page.getByRole("heading", {
      name: "Weekly class times that make it easier to find the right session.",
    })
  ).toBeVisible();
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

  await page.goto("/classes/weekend-yoga-flow");

  await expect(page.getByRole("heading", { level: 1, name: "Weekend Yoga Flow" })).toBeVisible();
  const upcomingSessions = page.locator("aside").filter({ hasText: "Upcoming Sessions" });
  await expect(upcomingSessions.getByRole("heading", { name: "Upcoming Sessions" })).toBeVisible();
  await expect(upcomingSessions.getByText("6/15 spots")).toBeVisible();
  await expect(upcomingSessions.getByText("15/15 spots")).toBeVisible();
  await expect(upcomingSessions.getByRole("button", { name: /Book 21 March 2026/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Full Schedule" }).first()).toHaveAttribute(
    "href",
    "/schedule"
  );
});
