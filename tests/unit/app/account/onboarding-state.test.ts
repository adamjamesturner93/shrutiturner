import { describe, expect, it } from "vitest";
import { deriveOnboardingState } from "@/lib/account/onboarding-service";

describe("deriveOnboardingState", () => {
  it("starts with the profile step when nothing is complete", () => {
    expect(deriveOnboardingState({})).toEqual({
      isComplete: false,
      checklistComplete: false,
      nextStep: "profile",
      missingSteps: ["profile", "legal", "source", "health"],
    });
  });

  it("moves to welcome when the checklist is complete but onboarding is not finished", () => {
    expect(
      deriveOnboardingState({
        firstName: "Jamie",
        lastName: "Member",
        dob: "1987-01-01",
        hasAgreedToTerms: true,
        hasAgreedToHealth: true,
        heardAboutSource: "google",
        hasHealthProfile: true,
        hasConsentedToHealthData: true,
      })
    ).toEqual({
      isComplete: false,
      checklistComplete: true,
      nextStep: "welcome",
      missingSteps: [],
    });
  });

  it("keeps the health step incomplete when the health data consent is stale", () => {
    expect(
      deriveOnboardingState({
        firstName: "Jamie",
        lastName: "Member",
        dob: "1987-01-01",
        hasAgreedToTerms: true,
        hasAgreedToHealth: true,
        heardAboutSource: "google",
        hasHealthProfile: true,
        hasConsentedToHealthData: true,
        needsHealthDataConsentRefresh: true,
      })
    ).toEqual({
      isComplete: false,
      checklistComplete: false,
      nextStep: "health",
      missingSteps: ["health"],
    });
  });

  it("marks onboarding complete only after the welcome step has been persisted", () => {
    expect(
      deriveOnboardingState({
        firstName: "Jamie",
        lastName: "Member",
        dob: "1987-01-01",
        hasAgreedToTerms: true,
        hasAgreedToHealth: true,
        heardAboutSource: "google",
        hasHealthProfile: true,
        hasConsentedToHealthData: true,
        isOnboarded: true,
      })
    ).toEqual({
      isComplete: true,
      checklistComplete: true,
      nextStep: "complete",
      missingSteps: [],
    });
  });
});
