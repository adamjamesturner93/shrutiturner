import { getBaseSiteUrlFromEnv } from "@/lib/env";

const CANONICAL_PRODUCTION_SITE_URL = "https://shrutiturner.co.uk";

export function getBaseSiteUrl() {
  return getBaseSiteUrlFromEnv();
}

export function buildAbsoluteUrl(path: string) {
  const base = getBaseSiteUrl();
  if (!path.startsWith("/")) {
    return `${base}/${path}`;
  }
  return `${base}${path}`;
}

export function getCanonicalProductionSiteUrl() {
  return CANONICAL_PRODUCTION_SITE_URL;
}

export function shouldRedirectToCanonicalProductionHost(hostname?: string | null) {
  return Boolean(hostname) && hostname.toLowerCase() !== "shrutiturner.co.uk";
}
