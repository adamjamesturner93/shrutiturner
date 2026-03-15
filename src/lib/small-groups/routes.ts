export function buildSmallGroupTemplateHref(templateSlug: string) {
  return `/classes/small-group/${templateSlug}`;
}

export function buildSmallGroupTemplateCheckoutHref(
  templateSlug: string,
  runSlug: string,
  options?: { gift?: boolean; checkoutState?: "success" | "cancelled" }
) {
  const params = new URLSearchParams({ run: runSlug });
  if (options?.gift) params.set("gift", "1");
  if (options?.checkoutState) params.set("checkout", options.checkoutState);
  return `${buildSmallGroupTemplateHref(templateSlug)}/checkout?${params.toString()}`;
}

export function buildDashboardSmallGroupRunHref(runSlug: string) {
  return `/dashboard/small-groups/${runSlug}`;
}

export function buildAdminSmallGroupRunHref(runSlug: string) {
  return `/admin/programmes/${runSlug}`;
}
