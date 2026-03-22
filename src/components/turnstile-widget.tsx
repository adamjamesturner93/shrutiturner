"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/components/ui/utils";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  className?: string;
  onTokenChange: (token: string) => void;
  theme?: "light" | "dark" | "auto";
}

export function TurnstileWidget({
  className,
  onTokenChange,
  theme = "auto",
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";
  const isE2ETestMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === "1";
  const reactId = useId();
  const containerId = `turnstile-${reactId.replace(/[:]/g, "")}`;

  useEffect(() => {
    if (!isE2ETestMode) return;
    onTokenChange("e2e-turnstile-token");
  }, [isE2ETestMode, onTokenChange]);

  if (isE2ETestMode) {
    return (
      <div
        data-testid="turnstile-bypass"
        className={cn(
          "text-muted-foreground min-h-[65px] rounded border border-dashed px-3 py-4 text-xs",
          className
        )}
      >
        Verification ready
      </div>
    );
  }

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const mount = () => {
      if (cancelled || !containerRef.current) return;
      if (!window.turnstile) {
        attempts += 1;
        if (attempts < 30) {
          timer = setTimeout(mount, 200);
        }
        return;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        callback: (token: string) => onTokenChange(token),
        "expired-callback": () => onTokenChange(""),
        "error-callback": () => onTokenChange(""),
      });
    };

    mount();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [containerId, onTokenChange, siteKey, theme]);

  return <div id={containerId} ref={containerRef} className="min-h-[65px]" />;
}
