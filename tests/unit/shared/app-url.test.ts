import { describe, expect, it } from "vitest";
import {
  getCanonicalProductionSiteUrl,
  shouldRedirectToCanonicalProductionHost,
} from "@/lib/app-url";

describe("app url helpers", () => {
  it("uses the .co.uk production canonical URL", () => {
    expect(getCanonicalProductionSiteUrl()).toBe("https://shrutiturner.co.uk");
  });

  it("redirects non-canonical production hosts", () => {
    expect(shouldRedirectToCanonicalProductionHost("shrutiturner.co.uk")).toBe(false);
    expect(shouldRedirectToCanonicalProductionHost("SHRUTITURNER.CO.UK")).toBe(false);
    expect(shouldRedirectToCanonicalProductionHost("shrutiturner.com")).toBe(true);
    expect(shouldRedirectToCanonicalProductionHost("www.shrutiturner.co.uk")).toBe(true);
    expect(shouldRedirectToCanonicalProductionHost("www.shrutiturner.com")).toBe(true);
    expect(
      shouldRedirectToCanonicalProductionHost("move-well-adamjamesturner93s-projects.vercel.app")
    ).toBe(true);
  });
});
