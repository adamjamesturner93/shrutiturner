import { describe, it, expect } from "vitest";
import { programmeCalendarDay } from "@/lib/programmes/calendar-time";
describe("London calendar scheduling", () => {
  it("keeps Monday releases at midnight when crossing spring DST", () => {
    expect(programmeCalendarDay(new Date("2027-03-22T00:00Z"), 7).toISOString()).toBe(
      "2027-03-28T23:00:00.000Z"
    );
  });
  it("keeps Friday prompts at 9am when crossing autumn DST", () => {
    expect(programmeCalendarDay(new Date("2027-10-29T08:00Z"), 7).toISOString()).toBe(
      "2027-11-05T09:00:00.000Z"
    );
  });
});
