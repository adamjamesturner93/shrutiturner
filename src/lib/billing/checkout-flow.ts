export type CheckoutSearchParams = Record<string, string | string[] | undefined>;

export function firstSearchParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export function buildMembershipCheckoutReturnPaths(interval: "monthly" | "annual") {
  const query = new URLSearchParams({
    purchase: "membership",
    interval,
  });

  return {
    successPath: `/dashboard/membership?checkout=success&${query.toString()}`,
    cancelPath: `/dashboard/membership?checkout=cancelled&${query.toString()}`,
  };
}

export function buildCreditCheckoutReturnPaths(bundle: 1 | 3 | 10) {
  const query = new URLSearchParams({
    purchase: "credits",
    bundle: String(bundle),
  });

  return {
    successPath: `/dashboard/membership?checkout=success&${query.toString()}`,
    cancelPath: `/dashboard/membership?checkout=cancelled&${query.toString()}`,
  };
}

export function buildPricingFallbackPath(params: CheckoutSearchParams) {
  const nextParams = new URLSearchParams({ checkout: "retry", checkoutError: "1" });
  const kind = firstSearchParam(params.kind);

  if (kind === "membership") {
    const interval = firstSearchParam(params.interval) === "annual" ? "annual" : "monthly";
    nextParams.set("purchase", "membership");
    nextParams.set("interval", interval);
  }

  if (kind === "credits") {
    const bundle = firstSearchParam(params.bundle);
    if (bundle === "1" || bundle === "3" || bundle === "10") {
      nextParams.set("purchase", "credits");
      nextParams.set("bundle", bundle);
    }
  }

  return `/dashboard/membership?${nextParams.toString()}`;
}
