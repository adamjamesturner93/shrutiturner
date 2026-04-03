import { expect, test } from "@playwright/test";
import { loginWithEmail } from "../../helpers/auth";
import { seedBlogUser } from "../../helpers/blog";

test("blog tag filtering updates the URL and survives refresh", async ({ page }) => {
  await page.goto("/blog");
  await page.getByRole("button", { name: "Yoga" }).click();

  await expect(page).toHaveURL(/tag=Yoga/);
  await expect(page.locator("article")).toHaveCount(1);

  await page.reload();

  await expect(page).toHaveURL(/tag=Yoga/);
  await expect(page.locator("article")).toHaveCount(1);
});

test("blog sorting can switch to alphabetical order", async ({ page }) => {
  await page.goto("/blog");
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "A-Z" }).click();

  await expect(page.locator("article h3").first()).toContainText(
    "Building Training Capacity When You Start From Zero"
  );
});

test("blog post supports copy-link sharing", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  await page.goto("/blog/strength-training-chronic-illness");
  await page.getByRole("button", { name: "Copy link" }).first().click();

  await expect(page.getByText("Link copied to clipboard")).toBeVisible();
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

test("authenticated readers can post a comment and a reply", async ({ page }) => {
  const { email } = await seedBlogUser("discussion");
  const commentText = `Helpful comment ${Date.now()}`;
  const replyText = `Helpful reply ${Date.now()}`;

  await loginWithEmail(page, email);
  await page.goto("/blog/strength-training-chronic-illness");

  await page.getByPlaceholder("Add your thoughts...").fill(commentText);
  await page.getByRole("button", { name: "Post comment" }).click();

  const discussion = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Discussion" }) })
    .first();
  const topLevelComment = discussion.locator("div.group").filter({ hasText: commentText }).first();
  await expect(topLevelComment).toBeVisible();
  await topLevelComment.getByRole("button", { name: "Reply" }).click();

  await topLevelComment.getByPlaceholder("Write your reply...").fill(replyText);
  await topLevelComment.getByRole("button", { name: "Reply" }).last().click();

  await expect(discussion.getByText(commentText)).toBeVisible();
  await expect(topLevelComment.getByText(replyText)).toBeVisible();
});
