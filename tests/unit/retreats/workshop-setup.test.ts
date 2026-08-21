import { beforeEach, describe, expect, it, vi } from "vitest";
import { AcceptanceType } from "@prisma/client";

const findUserMock = vi.fn();
const acceptanceStatesMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: findUserMock },
    retreatBooking: { findFirst: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("@/lib/legal/acceptance-service", () => ({
  getPhysicalServiceAcceptanceRequirements: vi.fn(() => []),
  getAcceptanceRequirementStates: acceptanceStatesMock,
}));

const { getWorkshopSetupState } = await import("@/lib/retreats/workshop-setup");

function currentAcceptances(current = true) {
  return [AcceptanceType.terms, AcceptanceType.health_waiver, AcceptanceType.health_data].map(
    (type) => ({ type, isCurrent: current })
  );
}

describe("online workshop setup readiness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    acceptanceStatesMock.mockResolvedValue(currentAcceptances());
  });

  it("is complete with verified identity, DOB, current health profile and legal evidence", async () => {
    findUserMock.mockResolvedValue({
      firstName: "Asha",
      lastName: "Khan",
      email: "asha@example.com",
      emailVerified: new Date(),
      dob: new Date("1990-01-01"),
      healthProfile: { declarationStatus: "none_declared", lastConfirmedAt: new Date() },
    });

    await expect(getWorkshopSetupState("user_1")).resolves.toMatchObject({
      complete: true,
      missing: [],
    });
  });

  it("returns explicit missing items for a new attendee", async () => {
    findUserMock.mockResolvedValue({
      firstName: "",
      lastName: "",
      email: "new@example.com",
      emailVerified: new Date(),
      dob: null,
      healthProfile: null,
    });
    acceptanceStatesMock.mockResolvedValue(currentAcceptances(false));

    const result = await getWorkshopSetupState("user_2");
    expect(result.complete).toBe(false);
    expect(result.missing).toEqual([
      "name",
      "date_of_birth",
      "health_profile",
      "terms",
      "health_waiver",
      "health_data",
    ]);
  });
});
