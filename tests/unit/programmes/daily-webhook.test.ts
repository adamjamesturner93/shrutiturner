import { it, expect, vi } from "vitest";
const sync = vi.hoisted(() => vi.fn(async () => ({ id: "replay" })));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/daily/service", () => ({ verifyDailyWebhookAuthorization: () => true }));
vi.mock("@/lib/replay/service", () => ({ syncReplayAssetFromDailyWebhook: sync }));
vi.mock("@/lib/classes/attendance-service", () => ({ recordAttendanceEvent: vi.fn() }));
vi.mock("@/lib/retreats/live-service", () => ({ recordRetreatAttendanceEvent: vi.fn() }));
import { POST } from "@/app/api/webhooks/daily/route";
it("reads the official nested Daily ready-to-download payload", async () => {
  const response = await POST(
    new Request("http://example.test/api/webhooks/daily", {
      method: "POST",
      body: JSON.stringify({
        type: "recording.ready-to-download",
        payload: { recording_id: "recording-1", room_name: "programme-room", status: "finished" },
      }),
    })
  );
  expect(response.ok).toBe(true);
  expect(sync).toHaveBeenCalledWith(
    expect.objectContaining({
      recordingId: "recording-1",
      roomName: "programme-room",
      status: "finished",
    })
  );
});
it("returns a retryable failure when recording synchronisation fails", async () => {
  sync.mockRejectedValueOnce(new Error("temporary database error"));
  const response = await POST(
    new Request("http://example.test/api/webhooks/daily", {
      method: "POST",
      body: JSON.stringify({
        type: "recording.ready-to-download",
        payload: { recording_id: "recording-1", room_name: "programme-room", status: "finished" },
      }),
    })
  );
  expect(response.status).toBe(500);
});
