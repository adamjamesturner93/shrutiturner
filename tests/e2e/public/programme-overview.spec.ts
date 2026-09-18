import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`programme overview explains the experience at ${viewport.width}px @a11y`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/programmes");
    await expect(
      page.getByRole("heading", { name: "Build strength. Find your approach." })
    ).toBeVisible();
    const photo = page.getByRole("img", { name: "Shruti walking beside the sea" });
    await expect(photo).toBeVisible();
    await expect
      .poll(() =>
        photo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)
      )
      .toBe(true);
    await page.getByRole("link", { name: "How programmes work" }).click();
    await expect(
      page.getByRole("heading", { name: "Learn together. Make it your own." })
    ).toBeVisible();
    for (const name of ["Understand", "Train together", "Make time to practise", "Ask and reflect"])
      await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    const question = page
      .locator("summary")
      .filter({ hasText: "What happens after the programme ends?" });
    await question.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByText("Each programme sets out when coached sessions finish", { exact: false })
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations
    ).toEqual([]);
    await page.screenshot({
      path: `/tmp/programmes-overview-${viewport.width}.png`,
      fullPage: true,
    });
  });
}
