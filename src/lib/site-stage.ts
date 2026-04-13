export type SiteStage = "full" | "holding";

export const HOLDING_PUBLIC_ALLOWLIST = ["/", "/privacy", "/terms", "/cookies", "/unsubscribe"];
export const HOLDING_SITEMAP_PATHS = ["/", "/privacy", "/terms", "/cookies"];

const HOLDING_BYPASS_PREFIXES = ["/dashboard", "/account", "/admin", "/login", "/signup", "/auth"];

const HOLDING_BYPASS_PATHS = ["/apple-icon", "/icon", "/icon-image"];

export function getSiteStage(): SiteStage {
  return process.env.SITE_STAGE === "holding" ? "holding" : "full";
}

export function isHoldingStage() {
  return getSiteStage() === "holding";
}

export function getExistingPlatformUrl() {
  const configured = process.env.EXISTING_PLATFORM_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  return "https://thechronicyogini.com";
}

export function isHoldingAllowedPathname(pathname: string) {
  return HOLDING_PUBLIC_ALLOWLIST.some((path) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function isHoldingBypassPathname(pathname: string) {
  return (
    HOLDING_BYPASS_PATHS.includes(pathname) ||
    HOLDING_BYPASS_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  );
}

export function shouldRedirectPublicPathInHolding(pathname: string) {
  return (
    isHoldingStage() && !isHoldingAllowedPathname(pathname) && !isHoldingBypassPathname(pathname)
  );
}
