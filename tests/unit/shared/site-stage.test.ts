import { afterEach, describe, expect, it } from "vitest";
import {
  getExistingPlatformUrl,
  isHoldingAllowedPathname,
  shouldRedirectPublicPathInHolding,
} from "@/lib/site-stage";

const originalStage = process.env.SITE_STAGE;
const originalPlatformUrl = process.env.EXISTING_PLATFORM_URL;

describe("site stage helpers", () => {
  afterEach(() => {
    process.env.SITE_STAGE = originalStage;
    process.env.EXISTING_PLATFORM_URL = originalPlatformUrl;
  });

  it("allows only the approved public routes during holding mode", () => {
    process.env.SITE_STAGE = "holding";

    expect(isHoldingAllowedPathname("/")).toBe(true);
    expect(isHoldingAllowedPathname("/privacy")).toBe(true);
    expect(isHoldingAllowedPathname("/unsubscribe")).toBe(true);
    expect(shouldRedirectPublicPathInHolding("/blog")).toBe(true);
    expect(shouldRedirectPublicPathInHolding("/classes")).toBe(true);
    expect(shouldRedirectPublicPathInHolding("/login")).toBe(false);
    expect(shouldRedirectPublicPathInHolding("/dashboard")).toBe(false);
    expect(shouldRedirectPublicPathInHolding("/icon")).toBe(false);
  });

  it("falls back to the existing platform homepage when no env var is set", () => {
    delete process.env.EXISTING_PLATFORM_URL;
    expect(getExistingPlatformUrl()).toBe("https://thechronicyogini.com");
  });
});
