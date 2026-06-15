import { expect, test } from "@playwright/test";
import { loginWithEmail } from "../../helpers/auth";
import { seedBlogCommentThread, seedBlogUser } from "../../helpers/blog";

const POST_SLUG = "strength-training-chronic-illness";

test("admin can hide, restore and delete a blog comment thread", async ({ page }) => {
  const label = `moderation-${Date.now()}`;
  const { email } = await seedBlogUser(label, "admin");
  const { topLevelContent } = await seedBlogCommentThread(POST_SLUG, label);

  await loginWithEmail(page, email, "123456", /\/admin(?:\/|$)/);

  const searchComments = async () => {
    await page.goto("/admin/blog-comments");
    await page.getByPlaceholder("Search content, author, or email").fill(topLevelContent);
    await page.getByRole("button", { name: "Search" }).click();
    const threadCard = page.locator('[data-slot="card"]').filter({ hasText: topLevelContent }).first();
    await expect(threadCard.getByText(topLevelContent)).toBeVisible();
    return threadCard;
  };

  let threadCard = await searchComments();
  await threadCard.getByRole("button", { name: "Hide thread" }).click();
  await expect(threadCard.getByRole("button", { name: "Restore" })).toBeVisible();

  await page.goto(`/blog/${POST_SLUG}`);
  await expect(page.getByText(topLevelContent)).toHaveCount(0);

  threadCard = await searchComments();
  await threadCard.getByRole("button", { name: "Restore" }).click();
  await expect(threadCard.getByRole("button", { name: "Hide thread" })).toBeVisible();

  await page.goto(`/blog/${POST_SLUG}`);
  await expect(page.getByText(topLevelContent)).toBeVisible();

  threadCard = await searchComments();
  await threadCard.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(topLevelContent)).toHaveCount(0);

  await page.goto(`/blog/${POST_SLUG}`);
  await expect(page.getByText(topLevelContent)).toHaveCount(0);
});
