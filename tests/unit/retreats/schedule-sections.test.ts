import { describe, expect, it } from "vitest";
import {
  splitScheduleSections,
  getScheduleDateLabel,
  getScheduleDisplayTitle,
} from "@/lib/retreats/schedule-sections";

describe("schedule Markdown sections", () => {
  it("renders legacy weekday lines as separate days without changing their content", () => {
    expect(
      splitScheduleSections(
        "Friday: Arrive at 4pm.\nSaturday: Yoga and rest.\nSunday: Depart at 2pm."
      )
    ).toEqual({
      introduction: "",
      sections: [
        { title: "Friday", body: "Arrive at 4pm." },
        { title: "Saturday", body: "Yoga and rest." },
        { title: "Sunday", body: "Depart at 2pm." },
      ],
    });
    expect(splitScheduleSections("Friday: Arrive at 4pm.\nDetails will follow.").sections).toEqual(
      []
    );
  });
  it("keeps introductory text and each day's formatted body", () => {
    expect(
      splitScheduleSections(
        "A relaxed weekend.\n\n## Friday — Unwind\n- Arrive\n- Rest\n\n## Saturday — Explore\n**Optional** walk"
      )
    ).toEqual({
      introduction: "A relaxed weekend.",
      sections: [
        { title: "Friday — Unwind", body: "- Arrive\n- Rest\n\n" },
        { title: "Saturday — Explore", body: "**Optional** walk\n" },
      ],
    });
  });
  it("preserves schedules without day headings and ignores fenced headings", () => {
    expect(splitScheduleSections("Arrive at 3pm")).toEqual({
      introduction: "Arrive at 3pm",
      sections: [],
    });
    expect(
      splitScheduleSections("## Friday\n```\n## Example\n```\n### Morning\nRest").sections
    ).toEqual([{ title: "Friday", body: "```\n## Example\n```\n### Morning\nRest\n" }]);
  });
});

describe("schedule dates", () => {
  it("shows the full date for each day of the chosen retreat", () => {
    expect(getScheduleDateLabel("2027-06-11T15:00:00Z", 0)).toBe("Friday, 11th June 2027");
    expect(getScheduleDateLabel("2027-06-11T15:00:00Z", 2)).toBe("Sunday, 13th June 2027");
  });
  it("uses the local calendar date and handles daylight saving and missing dates", () => {
    expect(getScheduleDateLabel("2027-10-30T23:30:00Z", 0)).toBe("Sunday, 31st October 2027");
    expect(getScheduleDateLabel("2027-10-30T23:30:00Z", 1)).toBe("Monday, 1st November 2027");
    expect(getScheduleDateLabel(undefined, 0)).toBe("");
    expect(getScheduleDateLabel("invalid", 0)).toBe("");
  });
});

it("removes only redundant weekday prefixes when a date is displayed", () => {
  for (const dash of ["-", "–", "—"])
    expect(getScheduleDisplayTitle(`Friday ${dash} Unwind`, "Friday, 11th June 2027")).toBe(
      "Unwind"
    );
  for (const title of ["Friday", "Friday —", "Arrival — Welcome", "Unwind"])
    expect(getScheduleDisplayTitle(title, "A date")).toBe(title);
  expect(getScheduleDisplayTitle("Friday — Unwind", "")).toBe("Friday — Unwind");
});
