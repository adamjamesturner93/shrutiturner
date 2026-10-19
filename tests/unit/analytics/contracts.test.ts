import { describe, expect, it, vi } from "vitest";
import { permittedPath, productionAnalytics, signupLocation } from "@/lib/analytics/contracts";
import { initialPurchase } from "@/lib/analytics/purchase";
import { makeReceipt, readReceipt } from "@/lib/analytics/receipt";
import {
  withAnalyticsPolicy,
  POLICY_ADDITIONS,
  ANALYTICS_STORAGE_DISCLOSURE,
} from "@/lib/analytics/policy";

describe("analytics privacy boundaries", () => {
  it("requires exact production deployment and hostname", () => {
    expect(productionAnalytics("production", "production", "shrutiturner.co.uk")).toBe(true);
    for (const host of [
      "localhost",
      "127.0.0.1",
      "example.ngrok.app",
      "site.vercel.app",
      "staging.shrutiturner.co.uk",
      "shrutiturner.co.uk.evil.test",
    ])
      expect(productionAnalytics("production", "production", host)).toBe(false);
    expect(productionAnalytics("production", "preview", "shrutiturner.co.uk")).toBe(false);
    expect(productionAnalytics("development", "production", "shrutiturner.co.uk")).toBe(false);
  });
  it("fails closed for unknown/private paths, even if registered", () => {
    for (const path of [
      "/admin",
      "/admin/bookings",
      "/dashboard",
      "/login",
      "/signup",
      "/account",
      "/auth/callback",
      "/retreats/balance/secret",
      "/gift/redeem/secret",
      "/api/test",
      "/email/private",
    ])
      expect(permittedPath(path, path)).toBe(false);
    expect(permittedPath("/coaching")).toBe(true);
    expect(permittedPath("/retreats/powis-house")).toBe(false);
    expect(permittedPath("/retreats/powis-house", "/retreats/powis-house")).toBe(true);
    expect(signupLocation("someone@example.com")).toBe("unknown");
  });
});

const paid = {
  sessionId: "cs_test_secret",
  expectedSessionId: "cs_test_secret",
  status: "complete",
  paymentStatus: "paid",
  amount: 22500,
  currency: "gbp",
  kind: "retreat_instalment",
  sequence: "1",
  slug: "powis-house",
  eventKind: "residential_retreat",
  outstandingPence: 67500,
};
describe("verified initial purchase projection", () => {
  it("reports the collected deposit, not the full booking value", () => {
    const result = initialPurchase(paid);
    expect(result).toMatchObject({
      value: 225,
      currency: "GBP",
      payment_type: "deposit",
      items: [{ item_id: "powis-house", price: 225, quantity: 1 }],
    });
    expect(result?.transaction_id).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(result)).not.toContain("cs_test_secret");
    expect(initialPurchase(paid)?.transaction_id).toBe(result?.transaction_id);
  });
  it.each([
    { paymentStatus: "unpaid" },
    { status: "expired" },
    { amount: null },
    { amount: 0 },
    { amount: -1 },
    { cancelled: true },
    { sequence: "2" },
    { kind: "retreat_balance" },
    { expectedSessionId: "other" },
    { currency: "usd" },
  ])("rejects unconfirmed or later payments: %j", (override) =>
    expect(initialPurchase({ ...paid, ...override })).toBeNull()
  );
  it("reports a fully-paid workshop using the actual discounted amount", () => {
    expect(
      initialPurchase({ ...paid, eventKind: "online_workshop", amount: 2800, outstandingPence: 0 })
    ).toMatchObject({
      value: 28,
      payment_type: "full",
      items: [{ item_category: "workshop", price: 28 }],
    });
  });
});

describe("newsletter proof", () => {
  it("rejects a receipt after its ten-minute lifetime", () => {
    vi.useFakeTimers();
    try {
      const token = makeReceipt("footer", true);
      vi.advanceTimersByTime(600_001);
      expect(readReceipt(token)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
  it("signs only structured fields and rejects tampering or expiry", () => {
    const token = makeReceipt("footer", true);
    expect(readReceipt(token)).toMatchObject({ source: "footer", guide: true });
    expect(readReceipt(token + "x")).toBeNull();
    expect(readReceipt("success")).toBeNull();
    expect(readReceipt(makeReceipt("private@example.com", false))).toMatchObject({
      source: "unknown",
      guide: false,
    });
  });
});

describe("approved policy additions", () => {
  it("preserves all original copy and only updates versions when a publication date is configured", () => {
    const original = {
      id: "cookies",
      slug: "cookies",
      title: "Cookie Policy",
      version: "old",
      body: "## 5. Analytics\n\nOriginal words.\n\n## 6. Managing cookies\n\nOriginal controls.",
    };
    expect(withAnalyticsPolicy(original, undefined)).toBe(original);
    const updated = withAnalyticsPolicy(original, "2026-10-18");
    expect(updated.version).toBe("old+analytics-2026-10-18");
    expect(updated.effectiveDate).toBe("2026-10-18");
    expect(updated.body).toContain(original.body.split("\n\n## 6")[0]);
    for (const paragraph of POLICY_ADDITIONS.cookies.paragraphs)
      expect(updated.body).toContain(paragraph);
    expect(updated.body).toContain("Original controls.");
    expect(updated.body).toContain(ANALYTICS_STORAGE_DISCLOSURE);
    expect(updated.body.indexOf("### Analytics storage and durations")).toBeGreaterThan(
      updated.body.indexOf(POLICY_ADDITIONS.cookies.paragraphs[2])
    );
    expect(updated.body.indexOf("### Analytics storage and durations")).toBeLessThan(
      updated.body.indexOf("## 6. Managing cookies")
    );
    expect(withAnalyticsPolicy(updated, "2026-10-18")).toBe(updated);
  });
});

it("adds A-05 exactly once when an existing policy already contains A-03", () => {
  const original = {
    id: "cookies",
    slug: "cookies",
    title: "Cookie Policy",
    version: "old",
    body: `Original words.\n\n## Google Analytics preferences\n\n${POLICY_ADDITIONS.cookies.paragraphs.join("\n\n")}\n\n## 6. Managing cookies\n\nOriginal controls.`,
  };
  const updated = withAnalyticsPolicy(original, "2026-10-18");
  expect(updated.body.split("### Analytics storage and durations")).toHaveLength(2);
  expect(updated.body.split("## Google Analytics preferences")).toHaveLength(2);
  expect(updated.body).toContain(ANALYTICS_STORAGE_DISCLOSURE);
  expect(withAnalyticsPolicy(updated, "2026-10-18")).toBe(updated);
});

it("renders the approved legal subsection as a heading and six-row table", async () => {
  const { parseLegalDocumentBody } = await import("@/lib/content/structured-text");
  const blocks = parseLegalDocumentBody(ANALYTICS_STORAGE_DISCLOSURE);
  expect(blocks[0]).toEqual({ type: "heading", level: 3, text: "Analytics storage and durations" });
  const table = blocks.find((block) => block.type === "table");
  expect(table?.type).toBe("table");
  if (table?.type === "table") {
    expect(table.headers).toEqual(["Storage", "Purpose", "Duration"]);
    expect(table.rows).toHaveLength(6);
    expect(table.rows[5][2]).toBe(
      "Up to 180 days from the recorded event, or sooner if analytics consent is withdrawn or browser storage is cleared."
    );
  }
});
it("serves an inert analytics frame with no Google code or indexing", async () => {
  const { GET } = await import("@/app/api/analytics/frame/route");
  const response = GET();
  expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  expect(await response.text()).not.toContain("script");
});
