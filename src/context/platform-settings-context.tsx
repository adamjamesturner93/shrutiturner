"use client";

import { createContext, useContext } from "react";
import type { RuntimePlatformSettings } from "@/lib/platform/runtime-settings";

const PlatformSettingsContext = createContext<RuntimePlatformSettings | null>(null);

export function PlatformSettingsProvider({
  value,
  children,
}: {
  value: RuntimePlatformSettings;
  children: React.ReactNode;
}) {
  return (
    <PlatformSettingsContext.Provider value={value}>{children}</PlatformSettingsContext.Provider>
  );
}

export function usePlatformSettings() {
  const value = useContext(PlatformSettingsContext);
  if (!value) {
    throw new Error("PlatformSettingsProvider is missing from the React tree.");
  }
  return value;
}
