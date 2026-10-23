import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }, info) => {
  if (info.title.includes("newsletter popup")) return;
  await page.addInitScript(() => sessionStorage.setItem("newsletter_shown", "true"));
});

for (const route of ["/", "/about", "/coaching", "/retreats", "/subscribe"]) {
  test(`${route} preserves a readable, accessible layout`, async ({ page }, info) => {
    await page.goto(route);
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(page.locator("main h1")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      info.project.use.viewport!.width
    );
    expect(
      (
        await new AxeBuilder({ page })
          .include("#main-content")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations
    ).toEqual([]);
    if (route === "/") {
      await expect(
        page.getByText(
          "My approach brings all three together, so we can adapt when we need to, challenge you when we can and keep your goals and real life at the centre.",
          { exact: true }
        )
      ).toBeVisible();
      await expect(page.getByRole("heading", { name: "Ways to Work With Me" })).toHaveCount(1);
      await expect(
        page.getByRole("link", { name: "Explore Experiences", exact: true })
      ).toHaveAttribute("href", "/retreats");
      await page.getByRole("button", { name: "Explore Fitness" }).focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Explore Fitness" })).toBeFocused();
    }
    if (route === "/coaching" || route === "/retreats") {
      await expect(page.getByText("01", { exact: true })).toHaveCount(
        route === "/coaching" ? 1 : 0
      );
    }
    if (route === "/retreats") {
      await expect(page.getByText("Next Up", { exact: true })).toHaveCount(0);
    }
    if (route === "/about") {
      await expect(page.getByRole("link", { name: "Explore Coaching", exact: true })).toHaveClass(
        /bg-primary/
      );
      await expect(
        page.getByText("I've also worked in very different environments", { exact: false })
      ).toBeVisible();
    }
    if (route === "/coaching") {
      const headings = await page.locator("main h2, main h3").allTextContents();
      expect(headings.indexOf("Included in every plan")).toBeLessThan(
        headings.indexOf("The coaching stays personal.")
      );
      expect(headings.indexOf("The coaching stays personal.")).toBeLessThan(
        headings.indexOf("Everything in one place.")
      );
      expect(
        headings.filter((heading) => heading === "What coaching clients say").length
      ).toBeLessThanOrEqual(1);
      await expect(page.getByRole("heading", { name: "Why Work With Shruti?" })).toHaveCount(1);
      await expect(page.locator('[data-analytics-plan="weekly"]')).toHaveAttribute(
        "href",
        "/coaching/enquire"
      );
    }
    if (route === "/subscribe") {
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Movement, strength and wellbeing for real life."
      );
    }
    await page.screenshot({
      path: info.outputPath(`${route.replaceAll("/", "") || "home"}.png`),
      fullPage: true,
    });
  });
}

test("accommodation follows daily rhythm and room selection remains available", async ({
  page,
}) => {
  await page.goto("/retreats/local-powis-room-review");
  await expect(page.locator("#rhythm")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Unwind", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Friday — Unwind", exact: true })).toHaveCount(0);
  const headings = await page.locator("main h2").allTextContents();
  expect(headings.indexOf("Daily rhythm")).toBeLessThan(headings.indexOf("Where you’ll stay"));
  const navLinks = await page
    .getByRole("navigation", { name: "Retreat sections" })
    .locator("a")
    .allTextContents();
  expect(navLinks.findIndex((label) => label.includes("Daily rhythm"))).toBeLessThan(
    navLinks.findIndex((label) => label.includes("Stay & travel"))
  );
  await expect(page.locator("#booking")).toBeVisible();
  const booking = page.locator("#booking");
  const desktop = await page.evaluate(() => window.innerWidth >= 1024);
  if (desktop) {
    await page.locator("#rhythm").scrollIntoViewIfNeeded();
    await expect(booking).toHaveCSS("position", "sticky");
  }
  const before = await booking.boundingBox();
  await page.locator("#booking summary").filter({ hasText: "Choose your room" }).click();
  if (desktop) {
    await expect(booking).toHaveCSS("position", "sticky");
    const after = await booking.boundingBox();
    expect(Math.abs(after!.y - before!.y)).toBeLessThan(2);
    await expect(booking).toHaveCSS("overflow-y", "auto");
  }
  await page.locator("#booking").getByRole("button", { name: "2 people", exact: true }).click();
  await expect(
    page.locator("#booking").getByRole("button", { name: "2 people", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
  expect(
    (
      await new AxeBuilder({ page })
        .include("#main-content")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations
  ).toEqual([]);
});

test("mobile experience navigation keeps full titles and keyboard access", async ({
  page,
}, info) => {
  test.skip(info.project.use.viewport!.width >= 1024, "Desktop uses the full navigation");
  await page.route("**/api/retreats/navigation", (route) =>
    route.fulfill({
      json: {
        items: [
          {
            slug: "local-powis-room-review",
            title: "Pause, Move, Breathe — Powis House",
            date: "11th–13th June 2027",
            format: "Residential retreat",
            location: "Stirling",
            status: "Open",
            imageUrl: "/images/shruti.jpeg",
            imageAlt: "Shruti Turner",
          },
        ],
      },
    })
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.locator("#mobile-main-menu");
  await menu.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(menu.getByText("Pause, Move, Breathe — Powis House", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
  await page.keyboard.press("Escape");
  await expect(menu.locator("details")).not.toHaveAttribute("open", "");
  await expect(menu.locator("summary")).toBeFocused();
  await expect(menu.getByRole("link", { name: "Client Login" })).toBeVisible();
});

test("newsletter popup traps focus, supports Escape and retains approved wording", async ({
  page,
}, info) => {
  test.skip(
    ![390, 1440].includes(info.project.use.viewport!.width),
    "Representative mobile and desktop dialog check"
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Reject analytics", exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading")).toHaveText(
    "Movement, strength and wellbeing for real life."
  );
  await expect(
    dialog.getByRole("button", { name: "Join the Newsletter", exact: true })
  ).toBeVisible();
  await page.keyboard.press("Tab");
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("approved newsletter CTA preserves pending double opt-in submission", async ({
  page,
}, info) => {
  test.skip(info.project.use.viewport!.width !== 390, "One mocked submission suffices");
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "window.turnstile = { render: (container, options) => { options.callback('test-token'); return 'test-widget'; }, remove: () => {}, reset: () => {} };",
    })
  );
  let submissions = 0;
  await page.route("**/api/newsletter/subscribe", (route) => {
    submissions++;
    expect(route.request().postDataJSON()).toMatchObject({
      source: "subscribe",
      consent: true,
      marketingOptIn: true,
    });
    return route.fulfill({ json: { ok: true, state: "pending" } });
  });
  await page.goto("/subscribe");
  const form = page.locator("main form");
  await form.getByLabel("First name").fill("Test");
  await form.getByLabel("Email address").fill("test@example.test");
  const submit = form.getByRole("button", { name: "Join the Newsletter", exact: true });
  await expect(submit).toBeDisabled();
  await form.getByRole("checkbox").check();
  await submit.click();
  await expect(page.getByRole("heading", { name: "Check your inbox." })).toBeVisible();
  expect(submissions).toBe(1);
});

test("public metadata, sitemap and preview indexing protection", async ({
  page,
  request,
}, info) => {
  test.skip(info.project.use.viewport!.width !== 1440, "Metadata is viewport-independent");
  for (const route of [
    "/",
    "/about",
    "/coaching",
    "/retreats",
    "/subscribe",
    "/retreats/pause-and-restore",
  ]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-robots-tag"]).toContain("noindex");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://shrutiturner.co.uk${route === "/" ? "" : route}`
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
    await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute(
      "content",
      /.+/
    );
    if (route === "/coaching")
      await expect(page).toHaveTitle(
        "Online Personal Training & Movement Coaching | Shruti Turner"
      );
    if (route === "/retreats") {
      await expect(page.getByRole("link", { name: "View Event", exact: true })).toHaveAttribute(
        "href",
        /\/retreats\/[^?]+\?date=.+/
      );
    }
  }
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const xml = await sitemap.text();
  expect(xml).toContain("https://shrutiturner.co.uk/subscribe");
  expect(xml).not.toMatch(/<loc>[^<]*(?:\/admin|\/dashboard|\/checkout|\/login)/);
  expect((await request.get("/coaching/enquire")).ok()).toBe(true);
  expect((await request.get("/contact")).ok()).toBe(true);
});

test("experience navigation has a usable loading skeleton and failure fallback", async ({
  page,
}, info) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/retreats/navigation", async (route) => {
    await pending;
    await route.fulfill({ status: 503, json: {} });
  });
  await page.goto("/");
  const mobile = info.project.use.viewport!.width < 1024;
  if (mobile) await page.getByRole("button", { name: "Open menu" }).click();
  const nav = mobile
    ? page.locator("#mobile-main-menu")
    : page.getByRole("navigation", { name: "Main navigation" });
  const panel = nav.locator("details");
  await panel.locator("summary").click();
  await expect(panel.getByRole("status")).toHaveText("Loading upcoming experiences…");
  await expect(panel.locator('[data-slot="skeleton"]').first()).toBeVisible();
  await expect(panel.getByRole("link", { name: "View all retreats & workshops" })).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .include(mobile ? "#mobile-main-menu" : 'nav[aria-label="Main navigation"]')
        .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
        .analyze()
    ).violations
  ).toEqual([]);
  release();
  await expect(panel.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await expect(panel.getByRole("link", { name: "View all retreats & workshops" })).toBeVisible();
  await panel.locator("summary").focus();
  await page.keyboard.press("Escape");
  await expect(panel).not.toHaveAttribute("open", "");
});
