import { describe, expect, it } from "vitest";
import { parsePoundsToPence } from "@/lib/billing/money-input";

describe("exact pounds input", () => {
  it.each([
    ["35", 3500],
    ["0.29", 29],
    ["35.5", 3550],
    [" 1.01 ", 101],
  ])("parses %s", (value, expected) => {
    expect(parsePoundsToPence(String(value))).toBe(expected);
  });
  it.each(["", "0", "-1", "1.001", "1e3", "NaN", "£35", "9007199254740991"])(
    "rejects %s",
    (value) => {
      expect(parsePoundsToPence(value)).toBeNull();
    }
  );
});
