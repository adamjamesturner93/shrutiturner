import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { JsonLd } from "@/components/json-ld";
import {
  NEWSLETTER_BODY,
  NEWSLETTER_BUTTON,
  NEWSLETTER_HEADLINE,
  FREE_GUIDE_SUPPORTING_LINE,
} from "@/lib/newsletter/lead-magnet";
import config from "../../../next.config.mjs";

afterEach(() => vi.unstubAllEnvs());
it("keeps unpublished environments unindexable even when page metadata permits indexing", async () => {
  vi.stubEnv("VERCEL_ENV", "preview");
  expect(await config.headers()).toEqual([
    { source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
  ]);
});
it("limits production noindex headers to private and transaction surfaces", async () => {
  vi.stubEnv("VERCEL_ENV", "production");
  const rules = await config.headers();
  expect(rules.map((rule) => rule.source)).toEqual(
    expect.arrayContaining(["/admin/:path*", "/account/:path*", "/retreats/:slug/checkout/:path*"])
  );
  expect(rules.map((rule) => rule.source)).not.toContain("/:path*");
});
it("escapes content that could terminate a JSON-LD script without changing parsed data", () => {
  const data = { name: "</script><script>alert(1)</script>" };
  const html = renderToStaticMarkup(createElement(JsonLd, { data }));
  expect(html.match(/<script/g)).toHaveLength(1);
  expect(JSON.parse(html.replace(/^.*?>/, "").replace(/<\/script>$/, ""))).toEqual(data);
});
it("uses exact B-06 invitation while preserving the guide-specific description", () => {
  expect(NEWSLETTER_HEADLINE).toBe("Movement, strength and wellbeing for real life.");
  expect(NEWSLETTER_BODY).toBe(
    "Practical ideas on movement, strength and wellbeing, alongside new articles, workshops and retreat updates. Join my newsletter and you'll also receive my free guide, Rebuild Your Strength, which explores training with pain, injury or chronic illness."
  );
  expect(NEWSLETTER_BUTTON).toBe("Join the Newsletter");
  expect(FREE_GUIDE_SUPPORTING_LINE).toBe(
    "Learn how to train intelligently, rebuild confidence and build strength in a way that works with your body."
  );
});
