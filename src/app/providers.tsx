"use client";

import { AuthProvider } from "@/context/auth-context";
import { PlatformSettingsProvider } from "@/context/platform-settings-context";
import type { RuntimePlatformSettings } from "@/lib/platform/runtime-settings";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export function Providers({
  children,
  platformSettings,
}: {
  children: React.ReactNode;
  platformSettings: RuntimePlatformSettings;
}) {
  return (
    <SessionProvider>
      <PlatformSettingsProvider value={platformSettings}>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--popover)",
                color: "var(--popover-foreground)",
                border: "1px solid var(--border)",
              },
            }}
          />
        </AuthProvider>
      </PlatformSettingsProvider>
    </SessionProvider>
  );
}
