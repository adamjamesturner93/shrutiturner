"use client";
import { cleanupDedupe, validDedupeRecord, DEDUPE_PREFIX } from "./storage";
import {
  ATTRIBUTION_KEY,
  ATTRIBUTION_TTL,
  campaignFromSearch,
  restoredAttribution,
  safeReferrer,
  type Attribution,
} from "./attribution";

let attribution: Attribution = {};
let attributionPage = "";
let attributionExpires = 0;
function clearAttribution() {
  attribution = {};
  attributionExpires = 0;
  attributionPage = "";
  try {
    sessionStorage.removeItem(ATTRIBUTION_KEY);
  } catch {
    /* Optional storage. */
  }
}
// Called only after production, route and consent checks. Never retain pre-consent URLs.
function updateAttribution(path: string) {
  if (attributionPage === path) return;
  const now = Date.now();
  let previous: Attribution | null = null;
  try {
    previous = restoredAttribution(sessionStorage.getItem(ATTRIBUTION_KEY), now);
  } catch {
    /* Optional storage. */
  }
  const campaign = campaignFromSearch(location.search);
  const referrer = safeReferrer(document.referrer);
  attribution = campaign || previous || (referrer ? { page_referrer: referrer } : {});
  attributionPage = path;
  attributionExpires = now + ATTRIBUTION_TTL;
  try {
    if (Object.keys(attribution).length)
      sessionStorage.setItem(
        ATTRIBUTION_KEY,
        JSON.stringify({ ...attribution, expires: now + ATTRIBUTION_TTL })
      );
    else sessionStorage.removeItem(ATTRIBUTION_KEY);
  } catch {
    /* In-memory attribution still works for this page. */
  }
}

import {
  CONSENT_COOKIE,
  CONSENT_KEY,
  MEASUREMENT_ID,
  permittedPath,
  type Consent,
  type Events,
} from "./contracts";

let frame: HTMLIFrameElement | null = null;
let enabled = false;
let registered: string | null = null;
let currentPath = "";
let lastPage = "";
let pending: Array<{ name: keyof Events; params: object }> = [];
let ready = false;
let storageFailed = false;
export function readConsent(): Consent {
  if (storageFailed) return null;
  try {
    const value = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
    return value?.expires > Date.now() && ["granted", "denied"].includes(value.choice)
      ? value.choice
      : null;
  } catch {
    return null;
  }
}
export function saveConsent(choice: Exclude<Consent, null>) {
  if (readConsent() !== "granted") clearAttribution();
  storageFailed = false;
  try {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ choice, expires: Date.now() + 180 * 86400000 })
    );
    document.cookie = `${CONSENT_COOKIE}=${choice}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  } catch {
    storageFailed = true;
    stopAnalytics();
    window.dispatchEvent(new Event("analytics-consent"));
    return;
  }
  if (choice === "denied") {
    clearAttribution();
    try {
      cleanupDedupe(localStorage, true);
      sessionStorage.removeItem("st-analytics-plan");
    } catch {
      /* Optional storage. */
    }
    stopAnalytics();
    // This first-party deletion never returns a receipt or sends an analytics event.
    void fetch("/api/analytics/receipt", { method: "DELETE", keepalive: true }).catch(() => {});
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.trim().split("=")[0];
      if (!/^_ga(?:_|$)/.test(name)) continue;
      for (const domain of ["", "; Domain=shrutiturner.co.uk", "; Domain=.shrutiturner.co.uk"])
        document.cookie = `${name}=; Max-Age=0; Path=/${domain}`;
    }
  }
  window.dispatchEvent(new Event("analytics-consent"));
}
export function registerAnalyticsPage(path: string) {
  registered = path;
  window.dispatchEvent(new Event("analytics-page"));
  return () => {
    if (registered === path) registered = null;
  };
}
export function canMeasure() {
  return (
    enabled &&
    readConsent() === "granted" &&
    currentPath === location.pathname &&
    permittedPath(location.pathname, registered)
  );
}
export function stopAnalytics() {
  // Removing the browsing context also destroys Google's timers/listeners. A removed script alone would not.
  try {
    const context = frame?.contentWindow as
      | (Window & { gtag?: (...args: unknown[]) => void; [key: `ga-disable-${string}`]: boolean })
      | null;
    if (context) {
      context[`ga-disable-${MEASUREMENT_ID}`] = true;
      context.gtag?.("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }
  } catch {
    /* A blocked analytics frame must not block navigation. */
  }
  if (pending.some((item) => item.name === "page_view")) lastPage = "";
  frame?.remove();
  frame = null;
  ready = false;
  pending = [];
  currentPath = "";
}
function send(name: keyof Events, params: object) {
  maintainAnalyticsStorage();
  if (!canMeasure() || !frame) return false;
  if (!ready) {
    pending.push({ name, params });
    return true;
  }
  const context = frame.contentWindow as Window & { gtag?: (...args: unknown[]) => void };
  context.gtag?.("event", name, {
    page_location: `https://shrutiturner.co.uk${currentPath}`,
    page_title: document.title,
    page_referrer: "",
    ...params,
    ...attribution,
  });
  return true;
}
export function track<K extends keyof Events>(name: K, params: Events[K], once?: string) {
  try {
    if (!canMeasure()) return;
    cleanupDedupe(localStorage);
    const key = once ? `${DEDUPE_PREFIX}${name}:${once}` : null;
    if (key && validDedupeRecord(localStorage.getItem(key))) return;
    if (send(name, params) && key)
      localStorage.setItem(key, JSON.stringify({ recordedAt: Date.now() }));
  } catch {
    /* Analytics must never interrupt a transaction. */
  }
}
export function syncAnalytics(production: boolean) {
  maintainAnalyticsStorage();
  enabled = production;
  if (!production || readConsent() !== "granted" || !permittedPath(location.pathname, registered)) {
    stopAnalytics();
    if (readConsent() !== "granted") clearAttribution();
    if (lastPage !== location.pathname) lastPage = "";
    return;
  }
  const path = location.pathname;
  if (currentPath && currentPath !== path) stopAnalytics();
  currentPath = path;
  updateAttribution(path);
  if (!frame) {
    frame = document.createElement("iframe");
    frame.hidden = true;
    frame.title = "Analytics";
    frame.setAttribute("aria-hidden", "true");
    frame.referrerPolicy = "no-referrer";
    // Only fixed allowlisted attribution values are interpolated, never raw URLs or user data. Automatic interactions occur in an empty document, not in the form document.
    const frameHtml = `<!doctype html><html><head><meta name="referrer" content="no-referrer"><title>Website analytics</title></head><body><script>
      window.dataLayer=[];function gtag(){dataLayer.push(arguments)};
      gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      gtag('js',new Date());
      gtag('config','${MEASUREMENT_ID}',{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_domain:'shrutiturner.co.uk',cookie_expires:15552000,cookie_update:false,page_location:'https://shrutiturner.co.uk/',page_referrer:'',page_title:'Website analytics',...${JSON.stringify(attribution)}});
      addEventListener('message',function(e){if(e.source!==parent||e.origin!=='https://shrutiturner.co.uk')return;
        if(e.data.type==='stop'){window['ga-disable-${MEASUREMENT_ID}']=true;gtag('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});return;}
        if(e.data.type==='event')gtag('event',e.data.name,e.data.params);
      });
      var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}';document.head.appendChild(s);
      parent.postMessage({type:'analytics-ready'},'https://shrutiturner.co.uk');
    </script></body></html>`;
    const target = frame;
    target.addEventListener(
      "load",
      () => {
        if (frame !== target || !canMeasure()) return;
        const document = target.contentDocument;
        if (!document) return;
        document.open();
        document.write(frameHtml);
        document.close();
      },
      { once: true }
    );
    target.src = "/api/analytics/frame";
    document.body.appendChild(target);
  }
  if (lastPage !== path) {
    const previous = lastPage;
    lastPage = path;
    track("page_view", {
      page_location: `https://shrutiturner.co.uk${path}`,
      page_title: document.title,
      page_referrer: previous ? `https://shrutiturner.co.uk${previous}` : "",
    });
  }
}
export function receiveAnalyticsMessage(event: MessageEvent) {
  if (
    event.source !== frame?.contentWindow ||
    event.origin !== location.origin ||
    event.data?.type !== "analytics-ready" ||
    !canMeasure()
  )
    return;
  ready = true;
  const queue = pending;
  pending = [];
  for (const item of queue) send(item.name, item.params);
  window.dispatchEvent(new Event("analytics-ready-client"));
}
// Destroy the tag synchronously before a client-side route change can expose private pages.
export function installNavigationGuard() {
  const push = history.pushState.bind(history),
    replace = history.replaceState.bind(history);
  const changed = (url?: string | URL | null) => {
    if (url && new URL(url, location.href).pathname !== location.pathname) stopAnalytics();
  };
  history.pushState = (...args) => {
    changed(args[2]);
    push(...args);
  };
  history.replaceState = (...args) => {
    changed(args[2]);
    replace(...args);
  };
  const onPop = () => {
    if (currentPath !== location.pathname) stopAnalytics();
  };
  window.addEventListener("popstate", onPop);
  window.addEventListener("pagehide", stopAnalytics);
  return () => {
    history.pushState = push;
    history.replaceState = replace;
    window.removeEventListener("popstate", onPop);
    window.removeEventListener("pagehide", stopAnalytics);
    stopAnalytics();
  };
}

export function rememberPlan(plan: "monthly" | "weekly" | "one_to_one") {
  try {
    if (canMeasure())
      sessionStorage.setItem(
        "st-analytics-plan",
        JSON.stringify({ plan, expires: Date.now() + 1800000 })
      );
  } catch {
    /* Optional attribution. */
  }
}
export function recalledPlan(): "monthly" | "weekly" | "one_to_one" | undefined {
  try {
    if (!canMeasure()) return;
    const data = JSON.parse(sessionStorage.getItem("st-analytics-plan") || "null");
    if (data?.expires > Date.now() && ["monthly", "weekly", "one_to_one"].includes(data.plan))
      return data.plan;
    sessionStorage.removeItem("st-analytics-plan");
  } catch {
    /* Optional attribution. */
  }
}

// Expired records are never reused; physical cleanup runs while the page is active
// and on its next visit (browser storage has no background expiry API).
export function maintainAnalyticsStorage() {
  try {
    const granted = readConsent() === "granted";
    cleanupDedupe(localStorage, !granted);
    const plan = JSON.parse(sessionStorage.getItem("st-analytics-plan") || "null");
    if (!granted || !plan || !(plan.expires > Date.now()) || plan.expires > Date.now() + 1800000)
      sessionStorage.removeItem("st-analytics-plan");
    if (!granted) clearAttribution();
    else if (attributionExpires && attributionExpires <= Date.now()) {
      clearAttribution();
      // Drop expired campaign defaults without losing subsequent conversions.
      stopAnalytics();
      attributionPage = location.pathname;
      syncAnalytics(enabled);
    } else {
      const stored = sessionStorage.getItem(ATTRIBUTION_KEY);
      if (stored && !restoredAttribution(stored, Date.now()))
        sessionStorage.removeItem(ATTRIBUTION_KEY);
    }
  } catch {
    /* Cleanup must never interrupt a transaction. */
  }
}
