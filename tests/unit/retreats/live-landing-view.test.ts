import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/components/dashboard-layout", () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => createElement("div", null, children),
}));
vi.mock("@/components/video/pre-join-lobby", () => ({
  PreJoinLobby: () => createElement("p", null, "Camera preview and join"),
}));
vi.mock("@/components/video/video-room", () => ({
  VideoRoom: () => createElement("p", null, "Connected room"),
}));
import { DashboardRetreatLive, type RetreatLiveLanding } from "@/views/dashboard/retreat-live";
const data = {
  bookingId: "booking",
  title: "The Middle Ground",
  startsAt: "2026-09-29T18:00:00Z",
  endsAt: "2026-09-29T22:30:00Z",
  timezone: "Europe/London",
  state: "pre_join",
  capacity: 30,
  exerciseClearance: { required: true, canExercise: false },
} as RetreatLiveLanding;
afterEach(() => vi.useRealTimers());
it("shows the ended state instead of asking for health setup or activating a camera on stale route data", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-30T06:00:00Z"));
  const html = renderToStaticMarkup(createElement(DashboardRetreatLive, { initialData: data }));
  expect(html).toContain("The Middle Ground has ended");
  expect(html).toContain("View booking");
  expect(html).not.toContain("Camera preview and join");
  expect(html).not.toContain("waiting for review");
});
it("keeps a cleared participant's device preview before the deadline", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-29T19:00:00Z"));
  const html = renderToStaticMarkup(
    createElement(DashboardRetreatLive, { initialData: { ...data, exerciseClearance: null } })
  );
  expect(html).toContain("Camera preview and join");
});
