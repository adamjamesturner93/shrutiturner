import { describe, expect, it } from "vitest";
import {
  DEFAULT_CLASS_OPERATIONAL_SETTINGS,
  getJoinWindowOpensAt,
  getLateJoinCutoffAt,
  isInsideEmptyClassAutoCancelWindow,
  shouldRefundCreditForCancellation,
} from "@/lib/classes/settings-service";

describe("class operational settings helpers", () => {
  it("derives join and late-join timestamps from the configured windows", () => {
    const startsAt = new Date("2026-03-24T18:00:00.000Z");

    expect(getJoinWindowOpensAt(startsAt, DEFAULT_CLASS_OPERATIONAL_SETTINGS).toISOString()).toBe(
      "2026-03-24T17:50:00.000Z"
    );
    expect(getLateJoinCutoffAt(startsAt, DEFAULT_CLASS_OPERATIONAL_SETTINGS).toISOString()).toBe(
      "2026-03-24T18:05:00.000Z"
    );
  });

  it("only refunds credits before the configured refund window", () => {
    const startsAt = new Date("2026-03-24T18:00:00.000Z");

    expect(
      shouldRefundCreditForCancellation(
        startsAt,
        DEFAULT_CLASS_OPERATIONAL_SETTINGS,
        new Date("2026-03-24T14:30:00.000Z")
      )
    ).toBe(true);
    expect(
      shouldRefundCreditForCancellation(
        startsAt,
        DEFAULT_CLASS_OPERATIONAL_SETTINGS,
        new Date("2026-03-24T15:30:00.000Z")
      )
    ).toBe(false);
  });

  it("switches empty-class auto-cancel inside the configured cutoff window", () => {
    const startsAt = new Date("2026-03-24T18:00:00.000Z");

    expect(
      isInsideEmptyClassAutoCancelWindow(
        startsAt,
        DEFAULT_CLASS_OPERATIONAL_SETTINGS,
        new Date("2026-03-24T14:59:59.000Z")
      )
    ).toBe(false);
    expect(
      isInsideEmptyClassAutoCancelWindow(
        startsAt,
        DEFAULT_CLASS_OPERATIONAL_SETTINGS,
        new Date("2026-03-24T15:00:00.000Z")
      )
    ).toBe(true);
  });
});
