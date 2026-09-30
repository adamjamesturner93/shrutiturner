import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import type { VideoRoom } from "@/components/video/video-room";
const { captured, push } = vi.hoisted(() => ({
  captured: { props: null as Parameters<typeof VideoRoom>[0] | null },
  push: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));
vi.mock("@/components/dashboard-layout", () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => createElement("main", null, children),
}));
vi.mock("@/components/video/video-room", () => ({
  VideoRoom: (props: Parameters<typeof VideoRoom>[0]) => {
    captured.props = props;
    return createElement("p", null, "Camera and microphone workspace");
  },
}));
import { DashboardRetreatHostLive } from "@/views/dashboard/retreat-host-live";
const base = {
  retreatDateId: "test-event",
  title: "Test workshop",
  startsAt: "2030-10-01T09:00:00Z",
  endsAt: "2030-10-01T10:00:00Z",
  timezone: "Europe/London",
  capacity: 10,
  registeredCount: 2,
  roomState: "prepared" as const,
  displayMode: "gallery" as const,
  chatEnabled: true,
  isRecorded: false,
  recordingState: "idle" as const,
};
beforeEach(() => {
  captured.props = null;
});
it("opens the video workspace immediately without starting the workshop", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
  const html = renderToStaticMarkup(createElement(DashboardRetreatHostLive, { initialData: base }));
  expect(html).toContain("Camera and microphone workspace");
  expect(html).not.toContain("Start session and enter");
  expect(fetchMock).not.toHaveBeenCalled();
  expect(captured.props?.onEndSession).toBeUndefined();
  await captured.props?.onStartSession?.();
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/retreats/host/test-event/lifecycle",
    expect.objectContaining({ method: "PATCH", body: JSON.stringify({ action: "start" }) })
  );
});
it("rejoins a started workshop without another start action", () => {
  renderToStaticMarkup(
    createElement(DashboardRetreatHostLive, { initialData: { ...base, roomState: "started" } })
  );
  expect(captured.props?.onStartSession).toBeUndefined();
  expect(captured.props?.onEndSession).toBeTypeOf("function");
});
it("does not open a video connection for an ended workshop", () => {
  expect(
    renderToStaticMarkup(
      createElement(DashboardRetreatHostLive, { initialData: { ...base, roomState: "ended" } })
    )
  ).toContain("Session ended");
  expect(captured.props).toBeNull();
});
