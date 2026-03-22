import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthContext } from "@/context/auth-context";
import { useI18n } from "@/lib/use-i18n";
import { describe, expect, it } from "vitest";

function renderProbe(providerValue?: unknown) {
  function Probe() {
    const value = useI18n();

    return React.createElement("div", {
      "data-timezone": value.prefs.timezone,
      "data-date-format": value.prefs.dateFormat,
      "data-formatted-date": value.fmtDate("2026-07-15T00:30:00.000Z"),
      "data-formatted-time": value.fmtTime("2026-07-15T14:30:00.000Z"),
      "data-formatted-time-str": value.fmtTimeStr("18:30"),
    });
  }

  const tree = providerValue
    ? React.createElement(
        AuthContext.Provider,
        { value: providerValue as React.ContextType<typeof AuthContext> },
        React.createElement(Probe)
      )
    : React.createElement(Probe);

  return renderToStaticMarkup(tree);
}

function getAttr(markup: string, attr: string) {
  const match = markup.match(new RegExp(`${attr}="([^"]+)"`));
  return match?.[1] ?? null;
}

describe("useI18n", () => {
  it("falls back to default preferences for unauthenticated users", () => {
    const markup = renderProbe();

    expect(getAttr(markup, "data-timezone")).toBe("Europe/London");
    expect(getAttr(markup, "data-date-format")).toBe("DD/MM/YYYY");
  });

  it("binds formatting helpers to the authenticated user's saved preferences", () => {
    const markup = renderProbe({
      isAuthenticated: true,
      user: {
        timezone: "America/New_York",
        dateFormat: "MM/DD/YYYY",
      },
    });

    expect(getAttr(markup, "data-timezone")).toBe("America/New_York");
    expect(getAttr(markup, "data-date-format")).toBe("MM/DD/YYYY");
    expect(getAttr(markup, "data-formatted-date")).toBe("July 14, 2026");
    expect(getAttr(markup, "data-formatted-time")).toBe("10:30 AM");
    expect(getAttr(markup, "data-formatted-time-str")).toBe("6:30 PM");
  });
});
