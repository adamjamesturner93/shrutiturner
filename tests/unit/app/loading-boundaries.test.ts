import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const APP_ROOT = path.join(process.cwd(), "src/app");

const RUNTIME_PAGE_FILES = [
  "(public)/blog/[slug]/page.tsx",
  "(public)/gift/redeem/[code]/page.tsx",
  "(public)/login/page.tsx",
  "(public)/signup/page.tsx",
  "(public)/retreats/[slug]/page.tsx",
  "(public)/retreats/[slug]/checkout/page.tsx",
  "(public)/retreats/balance/[token]/page.tsx",
  "(app)/admin/page.tsx",
  "(app)/admin/blog-comments/page.tsx",
  "(app)/admin/coaching/page.tsx",
  "(app)/admin/retreats/page.tsx",
  "(app)/admin/retreats/[id]/page.tsx",
  "(app)/dashboard/page.tsx",
  "(app)/dashboard/account/page.tsx",
  "(app)/dashboard/coaching/page.tsx",
  "(app)/dashboard/health/page.tsx",
  "(app)/dashboard/retreats/page.tsx",
  "(app)/dashboard/retreats/[id]/page.tsx",
  "(app)/dashboard/retreats/[id]/live/page.tsx",
  "(app)/dashboard/retreats/host/[retreatDateId]/page.tsx",
];

const RETIRED_REDIRECT_FILES = [
  "(app)/admin/classes/page.tsx",
  "(app)/admin/programmes/page.tsx",
  "(app)/dashboard/membership/page.tsx",
  "(app)/dashboard/referrals/page.tsx",
  "(app)/dashboard/replays/page.tsx",
  "(app)/dashboard/schedule/page.tsx",
  "(app)/dashboard/small-groups/page.tsx",
];

describe("runtime loading boundaries", () => {
  it.each(RUNTIME_PAGE_FILES)("keeps runtime work below Suspense in %s", (relativePath) => {
    const source = readFileSync(path.join(APP_ROOT, relativePath), "utf8");

    expect(source).toContain("<Suspense");
    expect(source).toMatch(/export default function Page/);
    expect(source).not.toMatch(/export default async function Page/);
  });

  it.each(RETIRED_REDIRECT_FILES)(
    "redirects %s without an artificial runtime wait",
    (relativePath) => {
      const source = readFileSync(path.join(APP_ROOT, relativePath), "utf8");

      expect(source).toContain("redirect(");
      expect(source).not.toContain("connection(");
      expect(source).not.toMatch(/export default async function Page/);
    }
  );

  it("provides visible Turnstile loading, failure and retry states", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/components/turnstile-widget.tsx"),
      "utf8"
    );

    expect(source).toContain("Loading security check…");
    expect(source).toContain("Security check unavailable.");
    expect(source).toContain("Retry");
    expect(source).toContain('role="alert"');
  });
});
