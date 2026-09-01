import "server-only";

import { getPostmarkClient, getPostmarkMessageStream } from "@/lib/postmark/client";

export type PostmarkOutboundStats = {
  sent: number;
  delivered: number;
  bounced: number;
  spamComplaints: number;
  uniqueOpens: number;
  uniqueClicks: number;
  totalOpens: number;
  totalClicks: number;
  tracked: number;
};

type PostmarkStatsRange = "7d" | "30d" | "90d" | "all";

function dateToken(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function normalizePostmarkOutboundStats(input: {
  Sent: number;
  Bounced: number;
  SpamComplaints: number;
  UniqueOpens: number;
  UniqueLinksClicked: number;
  Opens: number;
  TotalClicks: number;
  Tracked: number;
}): PostmarkOutboundStats {
  return {
    sent: input.Sent,
    delivered: Math.max(0, input.Sent - input.Bounced),
    bounced: input.Bounced,
    spamComplaints: input.SpamComplaints,
    uniqueOpens: input.UniqueOpens,
    uniqueClicks: input.UniqueLinksClicked,
    totalOpens: input.Opens,
    totalClicks: input.TotalClicks,
    tracked: input.Tracked,
  };
}

export async function getPostmarkOutboundStats(input: {
  messageStream?: string;
  tag?: string;
  range?: PostmarkStatsRange;
  now?: Date;
}): Promise<PostmarkOutboundStats | null> {
  try {
    const range = input.range || "all";
    const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : null;
    const now = input.now || new Date();
    const result = await getPostmarkClient().getOutboundOverview({
      tag: input.tag,
      fromDate: days ? dateToken(new Date(now.getTime() - days * 86400000)) : undefined,
      toDate: days ? dateToken(now) : undefined,
      messageStream: input.messageStream || getPostmarkMessageStream("marketing"),
    });

    return normalizePostmarkOutboundStats(result);
  } catch (error) {
    if (!(error instanceof Error && error.message === "POSTMARK_NOT_CONFIGURED")) {
      console.error("[postmark] failed to load outbound statistics", error);
    }
    return null;
  }
}
