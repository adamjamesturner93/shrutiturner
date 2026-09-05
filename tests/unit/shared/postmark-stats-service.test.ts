import { describe, expect, it } from "vitest";
import { normalizePostmarkOutboundStats } from "@/lib/postmark/stats-service";

describe("Postmark statistics service", () => {
  it("normalizes API overview totals and excludes bounces from delivered mail", () => {
    expect(
      normalizePostmarkOutboundStats({
        Sent: 100,
        Bounced: 4,
        SpamComplaints: 1,
        UniqueOpens: 52,
        UniqueLinksClicked: 18,
        Opens: 81,
        TotalClicks: 27,
        Tracked: 96,
      })
    ).toEqual({
      sent: 100,
      delivered: 96,
      bounced: 4,
      spamComplaints: 1,
      uniqueOpens: 52,
      uniqueClicks: 18,
      totalOpens: 81,
      totalClicks: 27,
      tracked: 96,
    });
  });
});
