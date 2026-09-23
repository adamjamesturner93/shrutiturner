import { describe, expect, it } from "vitest";
import { getOperationalNextStep } from "@/lib/coaching/admin-presentation";
import type { AdminCoachingApplicationDto } from "@/lib/api/types";

describe("closed coaching instructions", () => {
  it("does not ask staff to close Everfit after closure is saved", () => {
    const application = {
      status: "converted",
      coachingProfile: { status: "completed", everfitConnectionStatus: "closed" },
    } as AdminCoachingApplicationDto;
    expect(getOperationalNextStep(application)).toContain("Everfit access are closed");
    expect(getOperationalNextStep(application)).not.toContain("Remove access");
  });
  it("still directs staff to close an active Everfit account", () => {
    const application = {
      coachingProfile: { status: "completed", everfitConnectionStatus: "connected" },
    } as AdminCoachingApplicationDto;
    expect(getOperationalNextStep(application)).toContain("Remove access");
    expect(getOperationalNextStep(application)).not.toContain("below");
  });
});
