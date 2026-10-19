"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  readConsent,
  maintainAnalyticsStorage,
  saveConsent,
  syncAnalytics,
  receiveAnalyticsMessage,
  installNavigationGuard,
  stopAnalytics,
  canMeasure,
  track,
  rememberPlan,
} from "@/lib/analytics/client";
import { productionAnalytics, signupLocation, type Consent } from "@/lib/analytics/contracts";

export function AnalyticsPreferencesButton() {
  return (
    <button
      type="button"
      className="min-h-6 text-inherit underline underline-offset-4"
      onClick={() => window.dispatchEvent(new Event("analytics-preferences"))}
    >
      Analytics preferences
    </button>
  );
}
export function AnalyticsProvider({ productionDeployment }: { productionDeployment: boolean }) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [allow, setAllow] = useState(false);
  useEffect(() => {
    const dispose = installNavigationGuard();
    const coachingClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (!link || new URL(link.href, location.href).pathname !== "/coaching/enquire") return;
      const plan = link.dataset.analyticsPlan;
      const plan_interest =
        plan === "monthly" || plan === "weekly" || plan === "one_to_one" ? plan : undefined;
      const cta_location = plan_interest
        ? "plan"
        : link.closest("header, nav")
          ? "navigation"
          : link.closest("main section:first-of-type")
            ? "hero"
            : link.closest("main section:last-of-type")
              ? "final"
              : "content";
      if (plan_interest) rememberPlan(plan_interest);
      track("coaching_cta_click", {
        service_type: "coaching",
        cta_location,
        ...(plan_interest ? { plan_interest } : {}),
      });
    };
    document.addEventListener("click", coachingClick, true);
    const openPreferences = () => {
      setAllow(readConsent() === "granted");
      setOpen(true);
    };
    window.addEventListener("analytics-preferences", openPreferences);
    window.addEventListener("message", receiveAnalyticsMessage);
    return () => {
      document.removeEventListener("click", coachingClick, true);
      dispose();
      window.removeEventListener("analytics-preferences", openPreferences);
      window.removeEventListener("message", receiveAnalyticsMessage);
    };
  }, []);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const sync = () => {
      const value = readConsent();
      setConsent(value);
      if (value !== "granted") stopAnalytics();
      clearTimeout(timer);
      timer = setTimeout(() => {
        syncAnalytics(
          productionAnalytics(
            productionDeployment ? "production" : "development",
            productionDeployment ? "production" : "preview",
            location.hostname
          )
        );
        if (
          canMeasure() &&
          location.pathname === "/" &&
          new URLSearchParams(location.search).get("verified") === "success"
        )
          void consumeReceipt();
      }, 0);
    };
    sync();
    const expiryCheck = setInterval(() => {
      maintainAnalyticsStorage();
      if (readConsent() !== "granted") stopAnalytics();
    }, 1000);
    window.addEventListener("analytics-consent", sync);
    window.addEventListener("analytics-page", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("pageshow", sync);
    return () => {
      clearTimeout(timer);
      clearInterval(expiryCheck);
      window.removeEventListener("analytics-consent", sync);
      window.removeEventListener("analytics-page", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("pageshow", sync);
    };
  }, [pathname, productionDeployment]);
  const isPrivate =
    !/^\/(?:$|about$|coaching(?:\/enquire)?$|contact$|retreats(?:\/|$)|blog(?:\/|$)|subscribe$|cookies$|privacy$|terms$)/.test(
      pathname
    ) || pathname.startsWith("/retreats/balance/");
  return (
    <>
      {consent === null && !isPrivate ? (
        <section
          aria-label="Analytics preferences"
          className="bg-background fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-2xl border p-5 shadow-xl md:inset-x-auto md:right-5 md:ml-5"
        >
          <h2 className="text-xl">Analytics preferences</h2>
          <p className="mt-2 text-sm">
            May we use Google Analytics to understand how visitors use this website? It helps us
            measure visits, enquiries and bookings. Analytics is optional and stays off unless you
            accept. You can change your choice at any time.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => saveConsent("granted")}>
              Accept analytics
            </Button>
            <Button variant="outline" onClick={() => saveConsent("denied")}>
              Reject analytics
            </Button>
            <Link href="/cookies" className="text-sm underline">
              Cookie policy
            </Link>
          </div>
        </section>
      ) : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Analytics preferences</DialogTitle>
          <DialogDescription>
            Analytics helps us understand how visitors use the website and measure enquiries and
            bookings. You can switch it on or off here. Turning it off stops future analytics
            collection but doesn&apos;t delete information already collected. We don&apos;t use
            Google Analytics for personalised advertising.
          </DialogDescription>
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              checked={allow}
              onChange={(event) => setAllow(event.target.checked)}
              className="h-5 w-5"
            />
            Allow Google Analytics
          </label>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                saveConsent(allow ? "granted" : "denied");
                setOpen(false);
              }}
            >
              Save preferences
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
let receiptPending = false;
async function consumeReceipt() {
  if (receiptPending) return;
  receiptPending = true;
  try {
    const res = await fetch("/api/analytics/receipt", { method: "POST" });
    if (!res.ok) return;
    const data: { id?: string; source?: string; guide?: boolean } = await res.json();
    if (!data.id || !/^[a-f0-9-]{36}$/.test(data.id)) return;
    track(
      "sign_up",
      { signup_type: "newsletter", signup_location: signupLocation(data.source) },
      data.id
    );
    if (data.guide === true)
      track(
        "guide_delivery_initiated",
        {
          guide_id: "rebuild-your-strength",
          delivery_method: "email",
          signup_location: signupLocation(data.source),
        },
        data.id
      );
  } catch {
    /* Optional analytics never affects signup. */
  } finally {
    receiptPending = false;
  }
}
