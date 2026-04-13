import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("yoga public copy", () => {
  it("does not promise replay access for standard classes", () => {
    const source = readFileSync(join(process.cwd(), "src/views/classes-yoga.tsx"), "utf8");

    expect(source.toLowerCase()).not.toContain("catch the replays");
  });
});
