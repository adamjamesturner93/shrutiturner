import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { ClientHub } from "@/views/programmes/client-hub";

vi.mock("@/components/dashboard-layout", () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/views/programmes/shared", () => ({
  useProgrammeData: () => ({
    data: {
      firstName: "Fixture",
      coaching: null,
      programmes: [{ id: "old-programme", title: "Old programme", accessible: true }],
      events: [],
      actions: [
        {
          id: "programme-task",
          title: "Programme task",
          href: "/dashboard/programmes/old-programme/onboarding",
        },
        {
          id: "event-task",
          title: "Event task",
          href: "/dashboard/events/event",
          actionable: true,
          rank: 0,
          label: "View details",
        },
      ],
      discovery: [{ title: "Programme promotion", href: "/programmes/example" }],
      legacyClasses: false,
      legacyMembership: false,
    },
  }),
}));

it("keeps the dashboard focused on coaching and events even with programme enrolments", () => {
  const html = renderToStaticMarkup(createElement(ClientHub));
  expect(html).not.toContain("Old programme");
  expect(html).not.toContain("Programme task");
  expect(html).not.toContain("Programme promotion");
  expect(html).not.toContain('href="/programmes');
  expect(html).not.toContain('href="/dashboard/programmes');
  expect(html).toContain("Event task");
  expect(html).toContain('href="/retreats"');
});
