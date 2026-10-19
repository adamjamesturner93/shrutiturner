// Only structured, non-sensitive values cross the analytics boundary.
export const MEASUREMENT_ID = "G-PT4XP6G7CF";
export const CONSENT_KEY = "st-analytics-v1";
export const CONSENT_COOKIE = "st_analytics";
export type Consent = "granted" | "denied" | null;
export type Plan = "monthly" | "weekly" | "one_to_one";
export type EventType = "retreat" | "workshop";
export type Purchase = {
  transaction_id: string;
  currency: "GBP";
  value: number;
  payment_type: "deposit" | "full";
  items: Array<{ item_id: string; item_category: EventType; price: number; quantity: 1 }>;
};
export type Events = {
  page_view: { page_location: string; page_title: string; page_referrer: string };
  coaching_cta_click: {
    service_type: "coaching";
    cta_location: "hero" | "plan" | "final" | "navigation" | "content";
    plan_interest?: Plan;
  };
  generate_lead: {
    service_type: "coaching";
    form_location: "coaching_enquire";
    plan_interest?: Plan;
  };
  room_selected: {
    event_id: string;
    event_type: "retreat";
    room_category: "private" | "shared";
    occupancy: 1 | 2;
  };
  begin_checkout: { event_id: string; event_type: EventType; currency: "GBP"; value?: number };
  purchase: Purchase;
  sign_up: { signup_location: SignupLocation; signup_type: "newsletter" };
  guide_delivery_initiated: {
    signup_location: SignupLocation;
    guide_id: "rebuild-your-strength";
    delivery_method: "email";
  };
};
export type SignupLocation =
  | "popup"
  | "inline"
  | "footer"
  | "homepage"
  | "subscribe"
  | "holding-page"
  | "unknown";
export function signupLocation(value: unknown): SignupLocation {
  return ["popup", "inline", "footer", "homepage", "subscribe", "holding-page"].includes(
    String(value)
  )
    ? (value as SignupLocation)
    : "unknown";
}
export function productionAnalytics(
  nodeEnv: string | undefined,
  deployment: string | undefined,
  hostname: string
) {
  return (
    nodeEnv === "production" && deployment === "production" && hostname === "shrutiturner.co.uk"
  );
}
export const PUBLIC_PATHS = new Set([
  "/",
  "/about",
  "/coaching",
  "/coaching/enquire",
  "/contact",
  "/retreats",
  "/blog",
  "/subscribe",
  "/cookies",
  "/privacy",
  "/terms",
  "/refund-policy",
  "/acceptable-use",
]);
export function permittedPath(path: string, registered: string | null = null) {
  if (PUBLIC_PATHS.has(path)) return true;
  if (path !== registered) return false;
  return (
    /^\/(?:blog|retreats)\/[a-z0-9][a-z0-9-]*$/.test(path) ||
    /^\/retreats\/[a-z0-9][a-z0-9-]*\/checkout$/.test(path) ||
    path === "/retreats/checkout/success"
  );
}
export function eventType(kind: string | undefined): EventType {
  return kind === "online_workshop" || kind === "in_person_workshop" ? "workshop" : "retreat";
}
