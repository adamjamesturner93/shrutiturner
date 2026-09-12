import { describe, expect, it } from "vitest";
import { eventWallTimeToIso, eventIsoToWallTime } from "@/lib/retreats/event-time";
describe("event timezone input", () => {
  it("uses London summer time independently of the browser", () => {
    expect(eventWallTimeToIso("2026-09-18T16:00", "Europe/London")).toBe("2026-09-18T15:00:00.000Z");
    expect(eventIsoToWallTime("2026-09-18T15:00:00Z", "Europe/London")).toBe("2026-09-18T16:00");
  });
  it("rejects nonexistent and repeated clock-change times", () => {
    expect(() => eventWallTimeToIso("2026-03-29T01:30", "Europe/London")).toThrow("does not exist");
    expect(() => eventWallTimeToIso("2026-10-25T01:30", "Europe/London")).toThrow("occurs twice");
  });
  it("supports fractional offsets and rejects invalid dates", () => {
    expect(eventWallTimeToIso("2026-09-18T16:00", "Asia/Kolkata")).toBe("2026-09-18T10:30:00.000Z");
    expect(() => eventWallTimeToIso("2026-02-30T16:00", "Europe/London")).toThrow();
  });
});
