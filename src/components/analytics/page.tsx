"use client";
import { useEffect } from "react";
import { registerAnalyticsPage, track } from "@/lib/analytics/client";
import type { Purchase } from "@/lib/analytics/contracts";
export function AnalyticsPage({ path, purchase }: { path: string; purchase?: Purchase | null }) {
  useEffect(() => {
    const unregister = registerAnalyticsPage(path);
    const send = () => {
      if (purchase) track("purchase", purchase, purchase.transaction_id);
    };
    // Provider initialisation and consent updates complete before the optional conversion.
    const timer = setTimeout(send, 50);
    window.addEventListener("analytics-ready-client", send);
    return () => {
      clearTimeout(timer);
      unregister();
      window.removeEventListener("analytics-ready-client", send);
    };
  }, [path, purchase]);
  return null;
}
