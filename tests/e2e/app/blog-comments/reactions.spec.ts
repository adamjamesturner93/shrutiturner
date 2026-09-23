import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { db } from "../../helpers/db";
import { signInAdminFixture } from "../../helpers/admin-login";

test("admin sees likes on a post without comments and refreshes after unlike", async ({ page }) => {
  test.setTimeout(120_000);
  const key = randomUUID();
  const email = `reactions-${key}@example.test`;
  const postSlug = `reaction-only-${key}`;
  const user = await db.user.create({
    data: { email, name: "Test Coach", role: "admin", emailVerified: new Date() },
  });
  try {
    await db.blogReaction.create({ data: { postSlug, userId: user.id } });
    await signInAdminFixture(page, email, "/admin/blog-comments");
    const reactions = page.getByRole("region", { name: "Blog reactions" });
    const link = reactions.getByRole("link", { name: postSlug.replace(/-/g, " ") });
    await expect(link).toBeVisible();
    await expect(link.locator("..")).toContainText("1 like");
    await db.blogReaction.deleteMany({ where: { postSlug } });
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await expect(link).toHaveCount(0);
  } finally {
    await db.blogReaction.deleteMany({ where: { postSlug } });
    await db.authChallenge.deleteMany({ where: { email } });
    await db.user.delete({ where: { id: user.id } });
  }
});
