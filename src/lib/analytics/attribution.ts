// Values are a reviewed vocabulary, not arbitrary text made safe by a regex.
// Extend this list for new marketing links; never add audience/health/identity labels.
export const CAMPAIGN_SOURCES = [
  "instagram",
  "newsletter",
  "facebook",
  "linkedin",
  "google",
  "bing",
] as const;
export const CAMPAIGN_MEDIA = ["social", "organic_social", "email", "organic", "referral"] as const;
export const CAMPAIGN_NAMES = [
  "coaching",
  "newsletter",
  "pause-and-restore",
  "pause-and-restore-2026",
  "powis-house",
  "powis-house-2027",
] as const;
const REFERRERS: Record<string, string> = {
  "instagram.com": "instagram.com",
  "www.instagram.com": "instagram.com",
  "l.instagram.com": "instagram.com",
  "facebook.com": "facebook.com",
  "www.facebook.com": "facebook.com",
  "m.facebook.com": "facebook.com",
  "l.facebook.com": "facebook.com",
  "linkedin.com": "linkedin.com",
  "www.linkedin.com": "linkedin.com",
  "google.com": "google.com",
  "www.google.com": "google.com",
  "google.co.uk": "google.co.uk",
  "www.google.co.uk": "google.co.uk",
  "bing.com": "bing.com",
  "www.bing.com": "bing.com",
};
export const ATTRIBUTION_KEY = "st-analytics-attribution-v1";
export const ATTRIBUTION_TTL = 30 * 60 * 1000;
export type Attribution = {
  campaign_source?: (typeof CAMPAIGN_SOURCES)[number];
  campaign_medium?: (typeof CAMPAIGN_MEDIA)[number];
  campaign_name?: (typeof CAMPAIGN_NAMES)[number];
  page_referrer?: string;
};
function allowed<T extends string>(value: unknown, values: readonly T[]): T | undefined {
  if (typeof value !== "string" || value.length > 64) return;
  const normalised = value.toLowerCase();
  return values.includes(normalised as T) ? (normalised as T) : undefined;
}
export function safeReferrer(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.port)
      return;
    const domain = Object.hasOwn(REFERRERS, url.hostname) ? REFERRERS[url.hostname] : undefined;
    return domain ? `https://${domain}/` : undefined;
  } catch {
    return;
  }
}
export function campaignFromSearch(search: string): Attribution | null {
  if (search.length > 4096) return null;
  const params = new URLSearchParams(search);
  // Duplicate keys and incomplete/unknown source-medium pairs fail closed.
  if (["utm_source", "utm_medium", "utm_campaign"].some((key) => params.getAll(key).length > 1))
    return null;
  const campaign_source = allowed(params.get("utm_source"), CAMPAIGN_SOURCES);
  const campaign_medium = allowed(params.get("utm_medium"), CAMPAIGN_MEDIA);
  const campaign_name = allowed(params.get("utm_campaign"), CAMPAIGN_NAMES);
  if (!campaign_source || !campaign_medium || (params.has("utm_campaign") && !campaign_name))
    return null;
  return { campaign_source, campaign_medium, ...(campaign_name ? { campaign_name } : {}) };
}
export function restoredAttribution(raw: string | null, now: number): Attribution | null {
  try {
    const data = JSON.parse(raw || "null");
    if (
      !data ||
      !Number.isFinite(data.expires) ||
      data.expires <= now ||
      data.expires > now + ATTRIBUTION_TTL
    )
      return null;
    const campaign_source = allowed(data.campaign_source, CAMPAIGN_SOURCES);
    const campaign_medium = allowed(data.campaign_medium, CAMPAIGN_MEDIA);
    const campaign_name = allowed(data.campaign_name, CAMPAIGN_NAMES);
    if (campaign_source && campaign_medium && (!data.campaign_name || campaign_name))
      return { campaign_source, campaign_medium, ...(campaign_name ? { campaign_name } : {}) };
    const page_referrer =
      typeof data.page_referrer === "string" ? safeReferrer(data.page_referrer) : undefined;
    return page_referrer ? { page_referrer } : null;
  } catch {
    return null;
  }
}
