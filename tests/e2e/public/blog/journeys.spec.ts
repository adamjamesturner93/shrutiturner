import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loginWithEmail } from "../../helpers/auth";
import { seedBlogUser } from "../../helpers/blog";

test("blog uses the revised introductory and newsletter copy", async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("newsletter_shown", "true");
  });
  await page.goto("/blog");

  await expect(
    page.getByRole("heading", { name: "Evidence-based health and movement posts." })
  ).toBeVisible();
  await expect(
    page.getByText(
      "Making science accessible without jargon or fluff — just clear explanations to help you understand your body.",
      { exact: true }
    )
  ).toBeVisible();
  for (const heading of [
    "Understand your body.",
    "Train with more confidence.",
    "Make informed decisions.",
  ]) {
    await expect(page.getByText(heading, { exact: true })).toBeVisible();
  }
  const filterRowBounds = await Promise.all(
    [
      page.getByRole("button", { name: "All Articles", exact: true }),
      page.getByRole("button", { name: "wellbeing", exact: true }),
      page.getByRole("button", { name: "Show more article filters" }),
      page.getByRole("combobox", { name: "Sort blog posts by" }),
    ].map((control) => control.boundingBox())
  );
  expect(filterRowBounds.every(Boolean)).toBe(true);
  const filterRowCentres = filterRowBounds.map((bounds) => bounds!.y + bounds!.height / 2);
  expect(Math.max(...filterRowCentres) - Math.min(...filterRowCentres)).toBeLessThan(2);
  await expect(page.getByRole("heading", { name: "Join the newsletter." })).toBeVisible();
  await expect(
    page.getByText(
      "Get new articles, coaching notes and practical ideas for movement, strength and wellbeing, plus the free guide “Why Some Bodies Need Strength Before More Stretching”.",
      { exact: true }
    )
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Join the newsletter" })).toBeVisible();
  await expect(page.locator("#main-content input[type='email']")).toHaveCount(1);
  await expect(page.locator("footer input[type='email']")).toHaveCount(0);

  const accessibilityResults = await new AxeBuilder({ page })
    .include("#main-content")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(accessibilityResults.violations).toEqual([]);
});

test("blog tag filtering updates the URL and survives refresh", async ({ page }) => {
  await page.goto("/blog");
  await page.getByRole("button", { name: "Show more article filters" }).click();
  await page.getByRole("button", { name: "yoga", exact: true }).click();

  await expect(page).toHaveURL(/tag=Yoga/);
  const filteredArticleCount = await page.locator("article").count();
  expect(filteredArticleCount).toBeGreaterThan(0);

  await page.reload();

  await expect(page).toHaveURL(/tag=Yoga/);
  await expect(page.locator("article")).toHaveCount(filteredArticleCount);
});

test("blog pillar filtering uses the simplified brand categories", async ({ page }) => {
  await page.goto("/blog");
  await page.getByRole("button", { name: "rehabilitation", exact: true }).click();

  await expect(page).toHaveURL(/pillar=rehabilitation/);
  await expect(
    page.getByRole("heading", {
      name: "Strength Training for Hypermobility: What You Need to Know",
    })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Show more article filters" })).toHaveAttribute(
    "aria-expanded",
    "false"
  );
});

test("blog sorting can switch to alphabetical order", async ({ page }) => {
  await page.goto("/blog");
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "A-Z" }).click();

  const sortedTitles = await page.locator("article").getByRole("heading").allTextContents();
  expect(sortedTitles).toEqual([...sortedTitles].sort((left, right) => left.localeCompare(right)));
  await expect(page.locator("#main-content input[type='email']")).toHaveCount(1);
  await expect(page.locator("footer input[type='email']")).toHaveCount(0);
});

test("blog post supports copy-link sharing", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  await page.goto("/blog/strength-training-chronic-illness");
  await page.getByRole("button", { name: "Copy link" }).first().click();

  await expect(page.getByText("Link copied to clipboard")).toBeVisible();
});

test("blog post renders one page title and semantic article structure", async ({ page }) => {
  await page.goto("/blog/strength-training-chronic-illness");

  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("article h2").first()).toHaveText("The Evidence Base");
  await expect(page.locator("article ul").first()).toBeVisible();
  await expect(page.getByText("Movement & Fitness Coach")).toBeVisible();
  const visibleTags = await page.locator('a[href^="/blog?tag="] span').allTextContents();
  expect(visibleTags.length).toBeGreaterThan(0);
  expect(visibleTags.every((tag) => tag === tag.toLocaleLowerCase("en-GB"))).toBe(true);
});

test("blog post reaction toggle updates the public count", async ({ page }) => {
  let engagementCalls = 0;

  await page.route("**/api/blog/strength-training-chronic-illness/engagement", async (route) => {
    engagementCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        postSlug: "strength-training-chronic-illness",
        reactionCount: 1,
        commentCount: 0,
        hasReacted: false,
        comments: [],
      }),
    });
  });

  await page.route(
    "**/api/blog/strength-training-chronic-illness/reactions/toggle",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          hasReacted: true,
          reactionCount: 2,
        }),
      });
    }
  );

  await page.goto("/blog/strength-training-chronic-illness");

  const reactionButton = page.getByRole("button", { name: "React with heart" }).first();
  await expect(reactionButton).toContainText("1");
  await reactionButton.click();

  await expect(page.getByRole("button", { name: "Remove reaction" }).first()).toContainText("2");
  expect(engagementCalls).toBeGreaterThan(0);
});

test("blog post shows the logged-out comment prompt", async ({ page }) => {
  await page.route("**/api/blog/strength-training-chronic-illness/engagement", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        postSlug: "strength-training-chronic-illness",
        reactionCount: 0,
        commentCount: 0,
        hasReacted: false,
        comments: [],
      }),
    });
  });

  await page.goto("/blog/strength-training-chronic-illness");

  const discussion = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Discussion" }) })
    .first();
  await expect(discussion.getByRole("link", { name: "Log in" })).toBeVisible();
  await expect(discussion.getByText("to add a comment or reply.")).toBeVisible();
  await expect(page.getByRole("button", { name: "React with heart" }).first()).toContainText(
    "Helpful"
  );
});

test("related articles navigate to the linked post", async ({ page }) => {
  await page.goto("/blog/strength-training-chronic-illness");
  await expect(page.getByRole("heading", { name: "Related Articles" })).toBeVisible();
  const relatedArticle = page
    .locator("article")
    .filter({ hasText: "Programming Strength Training Around Flares and Bad Days" })
    .last();
  await relatedArticle
    .getByRole("link", { name: "Programming Strength Training Around Flares and Bad Days" })
    .click();

  await expect(page).toHaveURL(/\/blog\/programming-around-flares$/);
  await expect(
    page.getByRole("heading", { name: "Programming Strength Training Around Flares and Bad Days" })
  ).toBeVisible();
});

test("article navigation does not surface a blocking-route insight", async ({ page }) => {
  await page.goto("/blog");
  const articleLink = page.locator('main article a[href^="/blog/"]').first();
  const href = await articleLink.getAttribute("href");
  expect(href).toMatch(/^\/blog\//);

  await articleLink.click();

  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Next.js encountered runtime data during a navigation.")).toHaveCount(
    0
  );
});

test("authenticated readers can post a comment and a reply", async ({ page }) => {
  const { email } = await seedBlogUser("discussion");
  const commentText = `Helpful comment ${Date.now()}`;
  const replyText = `Helpful reply ${Date.now()}`;

  await loginWithEmail(page, email);
  await page.goto("/blog/strength-training-chronic-illness");

  await page.getByPlaceholder("Add your thoughts...").fill(commentText);
  const commentResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/blog/strength-training-chronic-illness/comments") &&
      response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Post comment" }).click();
  await commentResponse;

  const discussion = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Discussion" }) })
    .first();
  const topLevelComment = discussion.locator("div.group").filter({ hasText: commentText }).first();
  await expect(topLevelComment).toBeVisible({ timeout: 15000 });
  await topLevelComment.getByRole("button", { name: "Reply" }).click();

  await topLevelComment.getByPlaceholder("Write your reply...").fill(replyText);
  await topLevelComment.getByRole("button", { name: "Reply" }).last().click();

  await expect(discussion.getByText(commentText)).toBeVisible();
  await expect(topLevelComment.getByText(replyText)).toBeVisible();
});
