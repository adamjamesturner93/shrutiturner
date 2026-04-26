import { expect, test } from "@playwright/test";

test.describe("Auth session runtime", () => {
  test("/api/auth/session responds with JSON", async ({ request }) => {
    const response = await request.get("/api/auth/session");
    const contentType = response.headers()["content-type"] || "";
    const body = await response.text();

    expect(response.ok()).toBe(true);
    expect(contentType).toContain("application/json");
    expect(body.trim().startsWith("<")).toBe(false);
    expect(() => JSON.parse(body)).not.toThrow();
  });

  for (const path of ["/", "/login", "/signup", "/dashboard", "/admin"]) {
    test(`${path} does not emit Auth.js ClientFetchError`, async ({ page }) => {
      const messages: string[] = [];

      await page.route("https://challenges.cloudflare.com/**", (route) => route.abort());
      page.on("console", (message) => {
        if (message.type() === "error") {
          messages.push(message.text());
        }
      });
      page.on("pageerror", (error) => {
        messages.push(error.message);
      });

      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);

      expect(
        messages.filter(
          (message) => message.includes("ClientFetchError") || message.includes("/api/auth/session")
        )
      ).toEqual([]);
    });
  }
});
