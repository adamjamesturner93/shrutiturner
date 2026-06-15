import { describe, expect, it } from "vitest";
import {
  normalizeHealthProfile,
  normalizeHealthProfileApiResponse,
} from "@/data/health-profile-data";

describe("normalizeHealthProfile", () => {
  it("fills missing legacy profile fields with safe defaults", () => {
    expect(
      normalizeHealthProfile({
        declarationStatus: "context_declared",
        additionalNotes: "Existing note",
      })
    ).toMatchObject({
      declarationStatus: "context_declared",
      conditions: {},
      details: {},
      tracksFlareCheckIns: false,
      additionalNotes: "Existing note",
      lastConfirmedAt: "",
      lastUpdated: "",
      needsReview: false,
    });
  });

  it("unwraps successful API envelopes before normalising profile data", () => {
    expect(
      normalizeHealthProfileApiResponse({
        success: true,
        data: {
          declarationStatus: "context_declared",
          conditions: { ankle_pain_injury: true, hip_pain_injury: true },
          details: {},
          tracksFlareCheckIns: false,
          additionalNotes: "",
          lastConfirmedAt: "2026-06-15",
          lastUpdated: "2026-06-15",
          needsReview: false,
        },
      })
    ).toMatchObject({
      declarationStatus: "context_declared",
      conditions: { ankle_pain_injury: true, hip_pain_injury: true },
      lastUpdated: "2026-06-15",
    });
  });
});
