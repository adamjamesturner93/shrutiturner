import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthContext } from "@/context/auth-context";
import { useI18n } from "@/lib/use-i18n";
import { describe, expect, it } from "vitest";

function captureHook(providerValue?: unknown) {
  let captured: ReturnType<typeof useI18n> | null = null;

  function Probe() {
    captured = useI18n();
    return React.createElement("div");
  }

  const tree = providerValue
    ? React.createElement(
        AuthContext.Provider,
        { value: providerValue },
        React.createElement(Probe)
      )
    : React.createElement(Probe);

  renderToStaticMarkup(tree);
  return captured;
}

describe("useI18n", () => {
  it("falls back to default preferences for unauthenticated users", () => {
    const value = captureHook();

    expect(value?.prefs).toEqual({
      timezone: "Europe/London",
      dateFormat: "DD/MM/YYYY",
    });
  });

  it("binds formatting helpers to the authenticated user's saved preferences", () => {
    const value = captureHook({
      isAuthenticated: true,
      user: {
        timezone: "America/New_York",
        dateFormat: "MM/DD/YYYY",
      },
    });

    expect(value?.prefs).toEqual({
      timezone: "America/New_York",
      dateFormat: "MM/DD/YYYY",
    });
    expect(value?.fmtDate("2026-07-15T00:30:00.000Z")).toBe("July 14, 2026");
    expect(value?.fmtTime("2026-07-15T14:30:00.000Z")).toBe("10:30 AM");
    expect(value?.fmtTimeStr("18:30")).toBe("6:30 PM");
  });
});
