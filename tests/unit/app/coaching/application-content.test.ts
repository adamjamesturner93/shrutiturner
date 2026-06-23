import { describe, expect, it } from "vitest";
import { coachingApplicationQuestions } from "@/data/coaching-application";

describe("coaching application content", () => {
  it("clarifies recreational sporting goals without adding a professional status gate", () => {
    const sportingEventQuestion = coachingApplicationQuestions.find(
      (question) => question.id === "trainingEvent"
    );

    expect(sportingEventQuestion?.label).toBe(
      "Do you have a life or sporting event you are training for?"
    );
    expect(sportingEventQuestion?.helpText).toContain("Recreational events and amateur sport");
    expect(sportingEventQuestion?.helpText).toContain("insurance scope");
    expect(coachingApplicationQuestions.map((question) => question.id)).not.toContain(
      "professionalAthleteStatus"
    );
  });
});
