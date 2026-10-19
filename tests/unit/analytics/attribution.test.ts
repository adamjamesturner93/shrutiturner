import { describe, it, expect } from "vitest";
import {
  ATTRIBUTION_TTL,
  campaignFromSearch,
  safeReferrer,
  restoredAttribution,
} from "@/lib/analytics/attribution";

describe("strict marketing attribution", () => {
  it.each([
    ["instagram", "social", "powis-house-2027"],
    ["newsletter", "email", "pause-and-restore-2026"],
  ])("recognises %s campaigns with native GA fields", (source, medium, campaign) => {
    expect(
      campaignFromSearch(
        `?utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}&email=private@example.com&gclid=secret`
      )
    ).toEqual({ campaign_source: source, campaign_medium: medium, campaign_name: campaign });
  });
  it.each([
    "?utm_source=instagram&utm_medium=social&utm_campaign=alice-smith",
    "?utm_source=instagram&utm_medium=social&utm_campaign=arthritis",
    "?utm_source=instagram&utm_medium=social&utm_campaign=cs_live_secret",
    "?utm_source=private%40example.com&utm_medium=email",
    "?utm_source=instagram&utm_medium=social&utm_campaign=%253Cscript%253E",
    "?utm_source=instagram&utm_source=newsletter&utm_medium=email",
    "?utm_source=instagram",
    "?utm_source=instagram&utm_medium=paid_sensitive_audience",
    "?utm_source=instagram&utm_medium=social&utm_campaign=powis-house%0A",
  ])("drops unknown, sensitive and ambiguous campaign values: %s", (query) => {
    expect(campaignFromSearch(query)).toBeNull();
  });
  it("normalises case, but never admits arbitrary slug-shaped text", () => {
    expect(campaignFromSearch("?utm_source=INSTAGRAM&utm_medium=SOCIAL")).toEqual({
      campaign_source: "instagram",
      campaign_medium: "social",
    });
    expect(
      campaignFromSearch("?utm_source=instagram&utm_medium=social&utm_campaign=" + "a".repeat(5000))
    ).toBeNull();
  });
  it("only emits fixed referring origins, never paths, queries, credentials or unknown hosts", () => {
    expect(safeReferrer("https://l.instagram.com/?email=secret#token")).toBe(
      "https://instagram.com/"
    );
    expect(safeReferrer("https://www.google.co.uk/search?q=private+health")).toBe(
      "https://google.co.uk/"
    );
    for (const value of [
      "https://instagram.com.evil.test/",
      "https://person.instagram.com/",
      "https://private@example.com/",
      "https://user:secret@instagram.com/",
      "https://instagram.com:1234/",
      "https://checkout.stripe.com/secret",
      "https://shrutiturner.co.uk/login?token=x",
      "javascript:alert(1)",
    ])
      expect(safeReferrer(value)).toBeUndefined();
  });
  it("revalidates stored attribution and expiry rather than trusting browser storage", () => {
    const now = 1000;
    const record = {
      campaign_source: "newsletter",
      campaign_medium: "email",
      campaign_name: "coaching",
      expires: now + ATTRIBUTION_TTL,
    };
    expect(restoredAttribution(JSON.stringify({ ...record, email: "secret" }), now)).toEqual({
      campaign_source: "newsletter",
      campaign_medium: "email",
      campaign_name: "coaching",
    });
    expect(
      restoredAttribution(JSON.stringify({ ...record, campaign_name: "private-health" }), now)
    ).toBeNull();
    expect(restoredAttribution(JSON.stringify(record), now + ATTRIBUTION_TTL)).toBeNull();
    expect(restoredAttribution(JSON.stringify({ ...record, expires: Infinity }), now)).toBeNull();
  });
});
