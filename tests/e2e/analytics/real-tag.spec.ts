import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Opt-in offline verification: download gtag separately, then fulfil it locally.
// All browser requests are intercepted; no browser payload reaches Google or production.
const asset = process.env.REAL_GTAG_FILE;
test.skip(!asset, "Requires a separately downloaded real Google tag asset");
const compile = (name: string) =>
  ts.transpileModule(readFileSync(`src/lib/analytics/${name}.ts`, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
const harness = `(() => { const modules={}; ${["contracts", "attribution", "storage", "client"].map((name) => `{const exports={};((exports,require)=>{${compile(name)}})(exports,name=>modules[name.replace('./','')]);modules['${name}']=exports;}`).join("\n")}window.analytics=modules.client;window.addEventListener('message',modules.client.receiveAnalyticsMessage);})();`;

test("real Google code matches approved A-06 cookie lifetimes and withdrawal", async ({
  page,
}, testInfo) => {
  const blocked: string[] = [];

  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "www.googletagmanager.com" && url.pathname === "/gtag/js")
      return route.fulfill({ contentType: "text/javascript", body: readFileSync(asset!, "utf8") });
    if (url.origin === "https://shrutiturner.co.uk")
      return route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>Coaching | Shruti Turner</title><h1>Isolated verification</h1>",
      });
    blocked.push(url.hostname); // Never log collection payloads or raw URLs.
    return route.abort();
  });
  await page.goto("https://shrutiturner.co.uk/coaching");
  await page.addScriptTag({ content: harness });
  await page.evaluate("analytics.syncAnalytics(true)");
  expect((await page.context().cookies()).filter((c) => c.name.startsWith("_ga"))).toEqual([]);
  await page.evaluate("analytics.saveConsent('granted');analytics.syncAnalytics(true)");
  await page.waitForTimeout(1500);
  await expect
    .poll(async () =>
      (await page.context().cookies())
        .filter((c) => c.name.startsWith("_ga"))
        .map((c) => c.name)
        .sort()
    )
    .toEqual(["_ga", "_ga_PT4XP6G7CF"]);
  const initial = (await page.context().cookies()).filter((c) => c.name.startsWith("_ga"));
  const now = Date.now() / 1000;
  for (const cookie of initial) {
    expect(cookie.expires - now).toBeGreaterThan(180 * 86400 - 30);
    expect(cookie.expires - now).toBeLessThanOrEqual(180 * 86400 + 5);
  }
  await page.reload();
  await page.addScriptTag({ content: harness });
  await page.evaluate("analytics.syncAnalytics(true)");
  // Wait for real gtag to process the revisit, not merely for old cookies to exist.
  await expect.poll(() => blocked.length).toBeGreaterThan(0);
  await page.waitForTimeout(1500);
  const revisited = (await page.context().cookies()).filter((c) => c.name.startsWith("_ga"));

  await testInfo.attach("cookie-verification", {
    contentType: "application/json",
    body: JSON.stringify(
      {
        cookies: initial.map((c) => ({
          name: c.name,
          domain: c.domain,
          lifetimeSeconds: Math.round(c.expires - now),
        })),
        revisit: revisited.map((c) => ({
          name: c.name,
          expiryChangeSeconds:
            c.expires - (initial.find((first) => first.name === c.name)?.expires || c.expires),
        })),
        blockedCollectionHosts: [...new Set(blocked)],
      },
      null,
      2
    ),
  });
  console.log(
    "Real-tag expiry changes",
    revisited.map((c) => ({
      name: c.name,
      seconds: c.expires - (initial.find((first) => first.name === c.name)?.expires || c.expires),
    }))
  );
  await page.evaluate("analytics.saveConsent('denied')");
  expect((await page.context().cookies()).filter((c) => c.name.startsWith("_ga"))).toEqual([]);
  expect((await page.context().cookies()).find((c) => c.name === "st_analytics")?.value).toBe(
    "denied"
  );
  expect(revisited.map((cookie) => cookie.name).sort()).toEqual(["_ga", "_ga_PT4XP6G7CF"]);
  expect(revisited.find((cookie) => cookie.name === "_ga")?.expires).toBe(
    initial.find((cookie) => cookie.name === "_ga")?.expires
  );
  const streamExpiry = revisited.find((cookie) => cookie.name === "_ga_PT4XP6G7CF")!.expires;
  expect(streamExpiry).toBeGreaterThanOrEqual(
    initial.find((cookie) => cookie.name === "_ga_PT4XP6G7CF")!.expires
  );
  expect(streamExpiry - Date.now() / 1000).toBeLessThanOrEqual(180 * 86400 + 5);
  expect(streamExpiry - Date.now() / 1000).toBeGreaterThan(180 * 86400 - 30);
});
