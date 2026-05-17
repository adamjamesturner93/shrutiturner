import { describe, expect, it } from "vitest";
import { buildCalendarInvite } from "@/lib/email";

describe("buildCalendarInvite", () => {
  it("creates a REQUEST invite with UTC timestamps", () => {
    const invite = buildCalendarInvite({
      eventName: "Seeded Timetable Strength",
      startTime: new Date("2026-03-25T18:00:00.000Z"),
      durationMinutes: 45,
      description: "Join from the private studio dashboard.",
      method: "REQUEST",
      location: "Private Studio (online)",
      url: "https://shrutiturner.co.uk/dashboard/classes/strength/join?sessionId=session_123",
    });

    expect(invite).toContain("METHOD:REQUEST");
    expect(invite).toContain("SUMMARY:Seeded Timetable Strength");
    expect(invite).toContain("DTSTART:20260325T180000Z");
    expect(invite).toContain("DTEND:20260325T184500Z");
    expect(invite).toContain("LOCATION:Private Studio (online)");
    expect(invite).toContain(
      "URL:https://shrutiturner.co.uk/dashboard/classes/strength/join?sessionId=session_123"
    );
  });

  it("creates a CANCEL invite when the class is cancelled", () => {
    const invite = buildCalendarInvite({
      eventName: "Seeded Auto Cancel Empty Class",
      startTime: new Date("2026-03-25T09:00:00.000Z"),
      durationMinutes: 60,
      description: "This calendar event has been cancelled.",
      method: "CANCEL",
    });

    expect(invite).toContain("METHOD:CANCEL");
    expect(invite).toContain("STATUS:CONFIRMED");
    expect(invite).toContain("DTSTART:20260325T090000Z");
  });
});
