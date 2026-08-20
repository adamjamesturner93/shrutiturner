"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, LoaderCircle, RotateCcw } from "lucide-react";
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
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    isE2ETestMode ? "ready" : "loading"
  );
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!isE2ETestMode) return;
    onTokenChange("e2e-turnstile-token");
  }, [isE2ETestMode, onTokenChange]);

  useEffect(() => {
    if (isE2ETestMode) return;

    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    setStatus("loading");
    onTokenChange("");

    const mount = () => {
      if (cancelled || !containerRef.current) return;
      if (!window.turnstile) {
        attempts += 1;
        if (attempts < 30) {
          timer = setTimeout(mount, 200);
        } else {
          setStatus("error");
        }
        return;
      }

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          callback: (token: string) => {
            setStatus("ready");
            onTokenChange(token);
          },
          "expired-callback": () => {
            setStatus("ready");
            onTokenChange("");
          },
          "error-callback": () => {
            setStatus("error");
            onTokenChange("");
          },
        });
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    };

    mount();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [containerId, isE2ETestMode, onTokenChange, retryKey, siteKey, theme]);

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

  return (
    <div className={cn("relative min-h-[65px]", className)}>
      <div
        id={containerId}
        ref={containerRef}
        className={cn("min-h-[65px]", status === "error" && "invisible")}
      />
      {status === "loading" ? (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 flex min-h-[65px] items-center justify-center gap-2 rounded border border-current/20 px-3 text-xs opacity-70"
        >
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading security check…
        </div>
      ) : null}
      {status === "error" ? (
        <div
          role="alert"
          className="absolute inset-0 flex min-h-[65px] items-center justify-between gap-3 rounded border border-amber-300 bg-amber-50 px-3 text-xs text-amber-950"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Security check unavailable.
          </span>
          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : null}
    </div>
  );
}
