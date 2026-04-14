const CANONICAL_PRODUCTION_SITE_URL = "https://shrutiturner.co.uk";

export function getBaseSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
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
