import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import AxeBuilder from "@axe-core/playwright";

// Test the real runtime on a completely intercepted production-origin document.
// Neither production nor Google receives a request. No test override ships in the app.
const compile = (name: string) =>
  ts.transpileModule(readFileSync(`src/lib/analytics/${name}.ts`, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
const harness = `(() => {const contracts={exports:{}};((exports)=>{${compile("contracts")}})(contracts.exports);const attribution={exports:{}};((exports)=>{${compile("attribution")}})(attribution.exports);const storage={exports:{}};((exports)=>{${compile("storage")}})(storage.exports);const client={exports:{}};((exports,require)=>{${compile("client")}})(client.exports,(name)=>name==='./attribution'?attribution.exports:name==='./storage'?storage.exports:contracts.exports);window.analytics=client.exports;window.calls=[];window.addEventListener('message',client.exports.receiveAnalyticsMessage);window.addEventListener('message',e=>{if(e.data?.testCalls)window.calls.push(...e.data.testCalls)});client.exports.installNavigationGuard();})();`;
async function setup(page: Page, host = "shrutiturner.co.uk") {
  const requests: string[] = [];
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith("https://www.googletagmanager.com/gtag/js")) {
      expect(route.request().headers().referer || "").not.toMatch(/private|secret|email=/);
      requests.push(url);
      return route.fulfill({
        contentType: "text/javascript",
        body: `parent.postMessage({testCalls:dataLayer.map(x=>Array.from(x))},'*');window.gtag=function(){parent.postMessage({testCalls:[Array.from(arguments)]},'*')};`,
      });
    }
    if (url.startsWith(`https://${host}/`))
      return route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><html><head><title>Coaching | Shruti Turner</title></head><body><h1>Test fixture</h1></body></html>",
      });
    return route.abort();
  });
  await page.goto(`https://${host}/coaching?email=private%40example.com#secret`);
  await page.addScriptTag({ content: harness });
  return requests;
}
async function command(page: Page, code: string) {
  await page.evaluate(code);
}
async function calls(page: Page) {
  return page.evaluate("window.calls") as Promise<unknown[][]>;
}

test("basic consent, one page view, withdrawal, private navigation and safe payloads", async ({
  page,
}) => {
  const requests = await setup(page);
  await command(page, "analytics.syncAnalytics(true)");
  expect(requests).toHaveLength(0);
  await command(page, "analytics.saveConsent('denied'); analytics.syncAnalytics(true)");
  expect(requests).toHaveLength(0);
  await command(page, "analytics.saveConsent('granted'); analytics.syncAnalytics(true)");
  await expect
    .poll(
      async () => (await calls(page)).filter((x) => x[0] === "event" && x[1] === "page_view").length
    )
    .toBe(1);
  expect(requests).toHaveLength(1);
  await command(
    page,
    "analytics.syncAnalytics(true);history.replaceState(null,'','/coaching?accordion=2');analytics.syncAnalytics(true)"
  );
  expect((await calls(page)).filter((x) => x[0] === "event" && x[1] === "page_view")).toHaveLength(
    1
  );
  await command(
    page,
    "history.pushState(null,'','/about?token=secret');document.title='About | Shruti Turner';analytics.syncAnalytics(true)"
  );
  await expect
    .poll(
      async () => (await calls(page)).filter((x) => x[0] === "event" && x[1] === "page_view").length
    )
    .toBe(2);
  expect(JSON.stringify(await calls(page))).not.toMatch(
    /private@|example.com|token=|accordion=|#secret/
  );
  const config = (await calls(page)).find((x) => x[0] === "config");
  expect(config?.[2]).toMatchObject({
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  await command(page, "analytics.saveConsent('denied');analytics.syncAnalytics(true)");
  await expect(page.locator("iframe")).toHaveCount(0);
  const before = (await calls(page)).filter((x) => x[0] === "event").length;
  await command(
    page,
    "analytics.track('generate_lead',{service_type:'coaching',form_location:'coaching_enquire'})"
  );
  expect((await calls(page)).filter((x) => x[0] === "event")).toHaveLength(before);
  await command(page, "analytics.saveConsent('granted');analytics.syncAnalytics(true)");
  await expect(page.locator("iframe")).toHaveCount(1);
  await command(page, "history.pushState(null,'','/admin/bookings');analytics.syncAnalytics(true)");
  await expect(page.locator("iframe")).toHaveCount(0);
});

test("confirmed conversions are deduplicated and consent is required", async ({ page }) => {
  await setup(page);
  await command(
    page,
    "analytics.track('generate_lead',{service_type:'coaching',form_location:'coaching_enquire'});analytics.saveConsent('granted');analytics.syncAnalytics(true)"
  );
  await expect.poll(async () => (await calls(page)).filter((x) => x[0] === "event").length).toBe(1);
  await command(
    page,
    `for(let i=0;i<2;i++)analytics.track('purchase',{transaction_id:'opaque',currency:'GBP',value:225,payment_type:'deposit',items:[{item_id:'powis-house',item_category:'retreat',price:225,quantity:1}]},'opaque');`
  );
  await expect
    .poll(async () => (await calls(page)).filter((x) => x[1] === "purchase").length)
    .toBe(1);
  await command(
    page,
    "analytics.track('sign_up',{signup_location:'footer',signup_type:'newsletter'},'receipt');analytics.track('sign_up',{signup_location:'footer',signup_type:'newsletter'},'receipt')"
  );
  await expect
    .poll(async () => (await calls(page)).filter((x) => x[1] === "sign_up").length)
    .toBe(1);
  await command(
    page,
    "for(let i=0;i<2;i++)analytics.track('guide_delivery_initiated',{signup_location:'footer',guide_id:'rebuild-your-strength',delivery_method:'email'},'receipt')"
  );
  await expect
    .poll(async () => (await calls(page)).filter((x) => x[1] === "guide_delivery_initiated").length)
    .toBe(1);
  expect(JSON.stringify(await calls(page))).not.toContain("guide_download");
});

test("local preference controls are accessible and cannot load GA even after accepting", async ({
  page,
}) => {
  let google = 0;
  await page.route(/googletagmanager\.com|google-analytics\.com/, (route) => {
    google++;
    return route.abort();
  });
  await page.addInitScript(() => sessionStorage.setItem("newsletter_shown", "true"));
  await page.goto("/coaching/enquire");
  await page.getByRole("button", { name: "Reject analytics", exact: true }).click();
  await page.getByRole("button", { name: "Analytics preferences", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("doesn't delete information already collected");
  await dialog.getByLabel("Allow Google Analytics").check();
  expect(
    (
      await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations
  ).toEqual([]);
  await dialog.getByRole("button", { name: "Save preferences" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('iframe[title="Analytics"]')).toHaveCount(0);
  expect(google).toBe(0);
  await page.reload();
  await expect(page.getByRole("button", { name: "Accept analytics" })).toHaveCount(0);
});

for (const campaign of [
  { source: "instagram", medium: "social", name: "powis-house-2027" },
  { source: "newsletter", medium: "email", name: "pause-and-restore-2026" },
]) {
  test(`${campaign.source} attribution is consent-only, native, persistent and cleared on withdrawal`, async ({
    page,
  }) => {
    const requests = await setup(page);
    await command(
      page,
      `history.replaceState(null,'','/coaching?utm_source=${campaign.source}&utm_medium=${campaign.medium}&utm_campaign=${campaign.name}&email=private%40example.com&session_id=secret');analytics.syncAnalytics(true)`
    );
    expect(requests).toHaveLength(0);
    expect(
      await page.evaluate(() => sessionStorage.getItem("st-analytics-attribution-v1"))
    ).toBeNull();
    await command(page, "analytics.saveConsent('denied');analytics.syncAnalytics(true)");
    expect(
      await page.evaluate(() => sessionStorage.getItem("st-analytics-attribution-v1"))
    ).toBeNull();
    await command(page, "analytics.saveConsent('granted');analytics.syncAnalytics(true)");
    await expect
      .poll(async () => (await calls(page)).filter((x) => x[0] === "config").length)
      .toBe(1);
    const expected = {
      campaign_source: campaign.source,
      campaign_medium: campaign.medium,
      campaign_name: campaign.name,
    };
    expect((await calls(page)).find((x) => x[0] === "config")?.[2]).toMatchObject(expected);
    await command(
      page,
      "history.pushState(null,'','/coaching/enquire');analytics.syncAnalytics(true)"
    );
    await expect
      .poll(async () => (await calls(page)).filter((x) => x[1] === "page_view").length)
      .toBe(2);
    await command(
      page,
      "analytics.track('generate_lead',{service_type:'coaching',form_location:'coaching_enquire'})"
    );
    await expect
      .poll(async () => (await calls(page)).filter((x) => x[1] === "generate_lead").length)
      .toBe(1);
    expect((await calls(page)).find((x) => x[1] === "generate_lead")?.[2]).toMatchObject(expected);
    expect(JSON.stringify(await calls(page))).not.toMatch(
      /private|example.com|secret|session_id|email=/
    );
    // A full same-tab reload restores only the validated campaign record.
    await page.reload();
    await page.addScriptTag({ content: harness });
    await command(page, "analytics.syncAnalytics(true)");
    await expect
      .poll(async () => (await calls(page)).filter((x) => x[0] === "config").length)
      .toBe(1);
    expect((await calls(page)).find((x) => x[0] === "config")?.[2]).toMatchObject(expected);
    await command(page, "analytics.saveConsent('denied');analytics.syncAnalytics(true)");
    expect(
      await page.evaluate(() => sessionStorage.getItem("st-analytics-attribution-v1"))
    ).toBeNull();
    await expect(page.locator('iframe[title="Analytics"]')).toHaveCount(0);
  });
}

test("unknown campaign fields never reach Google configuration or events", async ({ page }) => {
  await setup(page);
  await command(
    page,
    "history.replaceState(null,'','/coaching?utm_source=instagram&utm_medium=social&utm_campaign=alice-smith&token=private');analytics.saveConsent('granted');analytics.syncAnalytics(true)"
  );
  await expect
    .poll(async () => (await calls(page)).filter((x) => x[1] === "page_view").length)
    .toBe(1);
  expect(JSON.stringify(await calls(page))).not.toMatch(/alice|private|utm_|campaign_name/);
});

test("allowlisted external domain enters native referrer fields without its query or path", async ({
  page,
}) => {
  await setup(page);
  await page.goto("https://shrutiturner.co.uk/coaching", {
    referer: "https://l.instagram.com/private-path?email=private@example.com",
  });
  await page.addScriptTag({ content: harness });
  await command(page, "analytics.saveConsent('granted');analytics.syncAnalytics(true)");
  await expect
    .poll(async () => (await calls(page)).filter((x) => x[1] === "page_view").length)
    .toBe(1);
  expect((await calls(page)).find((x) => x[0] === "config")?.[2]).toMatchObject({
    page_referrer: "https://instagram.com/",
  });
  expect((await calls(page)).find((x) => x[1] === "page_view")?.[2]).toMatchObject({
    page_referrer: "https://instagram.com/",
  });
  expect(JSON.stringify(await calls(page))).not.toMatch(/private|email=|example.com/);
});

test("withdrawal removes optional storage and retains the rejection preference", async ({
  page,
}) => {
  await setup(page);
  await command(
    page,
    "analytics.saveConsent('granted');analytics.syncAnalytics(true);analytics.rememberPlan('weekly');localStorage.setItem('st-ga-sent:purchase:test',JSON.stringify({recordedAt:Date.now()}));sessionStorage.setItem('st-analytics-attribution-v1',JSON.stringify({campaign_source:'newsletter',campaign_medium:'email',expires:Date.now()+1800000}));analytics.saveConsent('denied')"
  );
  expect(
    await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("st-ga-sent:")))
  ).toEqual([]);
  expect(await page.evaluate(() => sessionStorage.getItem("st-analytics-plan"))).toBeNull();
  expect(
    await page.evaluate(() => sessionStorage.getItem("st-analytics-attribution-v1"))
  ).toBeNull();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("st-analytics-v1")!).choice)
  ).toBe("denied");
  expect((await page.context().cookies()).find((c) => c.name === "st_analytics")?.value).toBe(
    "denied"
  );
});

test("expired optional storage is cleaned and cannot be reused", async ({ page }) => {
  await setup(page);
  await command(
    page,
    "analytics.saveConsent('granted');analytics.syncAnalytics(true);analytics.rememberPlan('weekly');localStorage.setItem('st-ga-sent:purchase:expired',JSON.stringify({recordedAt:Date.now()-180*86400000}));sessionStorage.setItem('st-analytics-plan',JSON.stringify({plan:'weekly',expires:Date.now()-1}));sessionStorage.setItem('st-analytics-attribution-v1',JSON.stringify({campaign_source:'newsletter',campaign_medium:'email',expires:Date.now()-1}));analytics.maintainAnalyticsStorage()"
  );
  expect(await page.evaluate(() => localStorage.getItem("st-ga-sent:purchase:expired"))).toBeNull();
  expect(await page.evaluate(() => sessionStorage.getItem("st-analytics-plan"))).toBeNull();
  expect(
    await page.evaluate(() => sessionStorage.getItem("st-analytics-attribution-v1"))
  ).toBeNull();
  expect(await page.evaluate("analytics.recalledPlan()")).toBeUndefined();
});

test("thirty minutes of inactivity expires campaign and plan storage without replaying the page view", async ({
  page,
}) => {
  await page.clock.install();
  await setup(page);
  await command(
    page,
    "history.replaceState(null,'','/coaching?utm_source=newsletter&utm_medium=email&utm_campaign=coaching');analytics.saveConsent('granted');analytics.syncAnalytics(true);analytics.rememberPlan('weekly')"
  );
  await expect
    .poll(async () => (await calls(page)).filter((x) => x[1] === "page_view").length)
    .toBe(1);
  await page.clock.fastForward(1800001);
  await command(page, "analytics.maintainAnalyticsStorage()");
  expect(
    await page.evaluate(() => sessionStorage.getItem("st-analytics-attribution-v1"))
  ).toBeNull();
  expect(await page.evaluate(() => sessionStorage.getItem("st-analytics-plan"))).toBeNull();
  await expect
    .poll(async () => (await calls(page)).filter((x) => x[0] === "config").length)
    .toBe(2);
  expect((await calls(page)).filter((x) => x[0] === "config")[1]?.[2]).not.toHaveProperty(
    "campaign_source"
  );
  expect((await calls(page)).filter((x) => x[1] === "page_view")).toHaveLength(1);
});
