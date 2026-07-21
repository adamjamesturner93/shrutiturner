import { describe, expect, it } from "vitest";
import { retreats } from "@/data/retreat-data";

describe("retreat public copy", () => {
  it("does not promise replay access for standard retreats", () => {
    const inPersonRetreats = retreats.filter((retreat) => retreat.deliveryMode === "in_person");
    const copy = JSON.stringify(inPersonRetreats).toLowerCase();
    expect(copy).not.toContain("replay access");
    expect(copy).not.toContain("seven-day replay");
  });
});
