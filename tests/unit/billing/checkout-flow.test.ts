import { describe, expect, it } from "vitest";
import {
  buildCreditCheckoutReturnPaths,
  buildMembershipCheckoutReturnPaths,
  buildPricingFallbackPath,
  firstSearchParam,
} from "@/lib/billing/checkout-flow";

describe("checkout-flow helpers", () => {
  it("builds membership checkout return paths with purchase context", () => {
    expect(buildMembershipCheckoutReturnPaths("annual")).toEqual({
      successPath: "/dashboard/membership?checkout=success&purchase=membership&interval=annual",
      cancelPath: "/dashboard/membership?checkout=cancelled&purchase=membership&interval=annual",
    });
  });

  it("builds credit checkout return paths with bundle context", () => {
    expect(buildCreditCheckoutReturnPaths(3)).toEqual({
      successPath: "/dashboard/membership?checkout=success&purchase=credits&bundle=3",
      cancelPath: "/dashboard/membership?checkout=cancelled&purchase=credits&bundle=3",
    });
  });

  it("preserves valid pricing checkout context in fallback paths", () => {
    expect(buildPricingFallbackPath({ kind: "credits", bundle: "10" })).toBe(
      "/dashboard/membership?checkout=retry&checkoutError=1&purchase=credits&bundle=10"
    );
    expect(buildPricingFallbackPath({ kind: "membership", interval: "annual" })).toBe(
      "/dashboard/membership?checkout=retry&checkoutError=1&purchase=membership&interval=annual"
    );
  });

  it("normalises repeated search params to their first value", () => {
    expect(firstSearchParam(["credits", "membership"])).toBe("credits");
    expect(firstSearchParam(undefined)).toBe("");
  });
});
