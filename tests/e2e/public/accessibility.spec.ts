import { expect, test } from "@playwright/test";
import {
  discoverPublicRoutes,
  formatAxeViolations,
  getAxeViolations,
  waitForPageToSettle,
} from "../helpers/a11y";

test.setTimeout(5 * 60_000);

test("public pages have no WCAG 2.2 AA axe-core violations", async ({ page, baseURL }) => {
  if (!baseURL) {
    throw new Error("Playwright baseURL is required for accessibility audits.");
  }

  const routeFilter = process.env.A11Y_ROUTE_FILTER
    ?.split(",")
    .map((route) => route.trim())
    .filter(Boolean);
  const routesToAudit =
    routeFilter && routeFilter.length > 0 ? routeFilter : await discoverPublicRoutes(baseURL);
  expect(routesToAudit.length).toBeGreaterThan(0);

  for (const route of routesToAudit) {
    await test.step(route, async () => {
      await page.goto(route);
      await waitForPageToSettle(page);

      const violations = await getAxeViolations(page);
      expect.soft(violations, formatAxeViolations(route, violations)).toEqual([]);
    });
  }

  expect(test.info().errors).toHaveLength(0);
});
