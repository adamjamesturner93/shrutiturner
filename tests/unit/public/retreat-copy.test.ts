import { describe, expect, it } from "vitest";
import { retreats } from "@/data/retreat-data";

describe("retreat public copy", () => {
  it("does not promise replay access for standard retreats", () => {
    const copy = JSON.stringify(retreats).toLowerCase();
    expect(copy).not.toContain("replay access");
    expect(copy).not.toContain("seven-day replay");
  });
});
