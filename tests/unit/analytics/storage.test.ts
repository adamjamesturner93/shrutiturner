import { describe, expect, it } from "vitest";
import { cleanupDedupe, DEDUPE_TTL, validDedupeRecord } from "@/lib/analytics/storage";
function storageFixture(values: Record<string, string>): Storage {
  const data = new Map(Object.entries(values));
  return {
    get length() {
      return data.size;
    },
    key: (i) => [...data.keys()][i] ?? null,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
    clear: () => data.clear(),
  };
}
describe("bounded deduplication retention", () => {
  it("retains a valid transaction marker without refreshing its recorded date", () => {
    const value = JSON.stringify({ recordedAt: 1000 });
    const storage = storageFixture({ "st-ga-sent:purchase:opaque": value });
    cleanupDedupe(storage, false, 1000 + DEDUPE_TTL - 1);
    expect(storage.getItem("st-ga-sent:purchase:opaque")).toBe(value);
    expect(validDedupeRecord(value, 1000 + DEDUPE_TTL - 1)).toBe(true);
    cleanupDedupe(storage, false, 1000 + DEDUPE_TTL);
    expect(storage.length).toBe(0);
  });
  it("cleans expired, invalid, legacy undated and future records without touching other storage", () => {
    const storage = storageFixture({
      "st-ga-sent:old": "1",
      "st-ga-sent:bad": "broken",
      "st-ga-sent:future": JSON.stringify({ recordedAt: 5000 }),
      "st-analytics-v1": "denied",
      unrelated: "keep",
    });
    cleanupDedupe(storage, false, 1000);
    expect(storage.length).toBe(2);
    expect(storage.getItem("st-analytics-v1")).toBe("denied");
    expect(storage.getItem("unrelated")).toBe("keep");
  });
  it("withdrawal deletes valid markers too", () => {
    const storage = storageFixture({
      "st-ga-sent:purchase:opaque": JSON.stringify({ recordedAt: 1000 }),
      "st-analytics-v1": "denied",
    });
    cleanupDedupe(storage, true, 1001);
    expect(storage.getItem("st-ga-sent:purchase:opaque")).toBeNull();
    expect(storage.getItem("st-analytics-v1")).toBe("denied");
  });
});
