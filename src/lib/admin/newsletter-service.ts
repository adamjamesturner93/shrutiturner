import { Prisma } from "@prisma/client";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { db } from "@/lib/db";
import { syncMarketingPreferenceForUser } from "@/lib/newsletter/subscriber-service";

export type SubscriptionType = "subscribed" | "unsubscribed";

export type AdminSubscriberDto = {
  id: string;
  userId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  marketingSubscribed: boolean;
  subscriptionType: SubscriptionType;
  source: string | null;
  updatedAt: string;
};

export type AdminSubscriberSegmentSummaryDto = {
  subscribed: number;
  unsubscribed: number;
  total: number;
};

export type AdminNewsletterCampaignSummaryDto = {
  id: string;
  providerCampaignId: string;
  subject: string;
  status: "sent" | "scheduled" | "sending" | "failed" | "failed_partial";
  sentDate: string;
  totalRecipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  spamComplaints: number;
  unsubscribed: number;
  failedSends: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  unsubscribeRate: number;
  bounceRate: number;
  complaintRate: number;
  audienceType?: string | null;
  triggeredBy?: string | null;
  sourceSystem: string;
};

export type AdminNewsletterCampaignDetailDto = AdminNewsletterCampaignSummaryDto & {
  topLinks: Array<{ url: string; clicks: number }>;
  eventTimeline: Array<{ date: string; opened: number; clicked: number; bounced: number }>;
};

export type AdminNewsletterSummaryDto = {
  totalSubscribers: number;
  subscribed: number;
  unsubscribed: number;
  unsubscribes30d: number;
  growth: {
    newSubscribers30d: number;
    verifiedSubscribers30d: number;
    unsubscribes30d: number;
    netGrowth30d: number;
    activeSubscriberCount: number;
  };
  sourceAttribution: Array<{
    source: string;
    total: number;
    subscribed: number;
    pending: number;
    unsubscribed: number;
  }>;
  campaigns: AdminNewsletterCampaignSummaryDto[];
  campaignsPagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  audienceReporting: {
    dateRange: string;
    source: string;
    exportHref: string;
    trend: Array<{
      date: string;
      newSubscribers: number;
      verifiedSubscribers: number;
      unsubscribes: number;
      netGrowth: number;
      bounces: number;
      spamComplaints: number;
    }>;
    sourceSegments: Array<{
      source: string;
      newSubscribers: number;
      verifiedSubscribers: number;
      unsubscribes: number;
      netGrowth: number;
      activeSubscriberCount: number;
    }>;
    campaignInfluence: Array<{
      campaignId: string;
      subject: string;
      sentDate: string;
      sourceSystem: string;
      delivered: number;
      opened: number;
      clicked: number;
      unsubscribed: number;
    }>;
  };
};

function toSubscriptionType(marketingSubscribed: boolean): SubscriptionType {
  return marketingSubscribed ? "subscribed" : "unsubscribed";
}

function toPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 1000) / 10;
}

function getCampaignSourceSystem(campaign: {
  contentfulEntryId: string | null;
  triggeredBy: string | null;
}) {
  if (campaign.contentfulEntryId || campaign.triggeredBy === "contentful_publish") {
    return "Contentful";
  }
  if (campaign.triggeredBy) return campaign.triggeredBy.replaceAll("_", " ");
  return "Manual";
}

function getCampaignRangeStart(range: string | undefined) {
  if (range === "7d") return new Date(Date.now() - 7 * 86400000);
  if (range === "90d") return new Date(Date.now() - 90 * 86400000);
  if (range === "all") return null;
  return new Date(Date.now() - 30 * 86400000);
}

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function createTrendBuckets(start: Date, end: Date) {
  const buckets = new Map<
    string,
    {
      date: string;
      newSubscribers: number;
      verifiedSubscribers: number;
      unsubscribes: number;
      netGrowth: number;
      bounces: number;
      spamComplaints: number;
    }
  >();
  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  );
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

  while (cursor <= last) {
    const key = toDateKey(cursor);
    buckets.set(key, {
      date: key,
      newSubscribers: 0,
      verifiedSubscribers: 0,
      unsubscribes: 0,
      netGrowth: 0,
      bounces: 0,
      spamComplaints: 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return buckets;
}

function buildCampaignWhere(params: {
  status?: string;
  dateRange?: string;
}): Prisma.EmailCampaignWhereInput {
  const where: Prisma.EmailCampaignWhereInput = {};
  if (
    params.status === "sent" ||
    params.status === "scheduled" ||
    params.status === "sending" ||
    params.status === "failed" ||
    params.status === "failed_partial"
  ) {
    where.status = params.status;
  }

  const rangeStart = getCampaignRangeStart(params.dateRange);
  if (rangeStart) {
    where.OR = [
      { sentAt: { gte: rangeStart } },
      { scheduledAt: { gte: rangeStart } },
      { createdAt: { gte: rangeStart } },
    ];
  }

  return where;
}

export async function getSubscriberSegmentSummary(): Promise<AdminSubscriberSegmentSummaryDto> {
  const [subscribed, unsubscribed] = await Promise.all([
    db.newsletterSubscriber.count({ where: { status: "subscribed" } }),
    db.newsletterSubscriber.count({ where: { status: "unsubscribed" } }),
  ]);

  return {
    subscribed,
    unsubscribed,
    total: subscribed + unsubscribed,
  };
}

export async function listAdminSubscribers(params: {
  type?: SubscriptionType | "all";
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 25));
  const search = params.search?.trim().toLowerCase();
  const type = params.type || "all";

  const where: Prisma.NewsletterSubscriberWhereInput = {
    status: type === "all" ? undefined : type === "subscribed" ? "subscribed" : "unsubscribed",
    OR: search
      ? [
          { email: { contains: search, mode: "insensitive" } },
          { user: { firstName: { contains: search, mode: "insensitive" } } },
          { user: { lastName: { contains: search, mode: "insensitive" } } },
          { user: { name: { contains: search, mode: "insensitive" } } },
        ]
      : undefined,
  };

  const [total, subscribers] = await Promise.all([
    db.newsletterSubscriber.count({ where }),
    db.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        userId: true,
        status: true,
        source: true,
        updatedAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
  ]);

  const items: AdminSubscriberDto[] = subscribers.map((subscriber) => {
    const marketingSubscribed = subscriber.status === "subscribed";
    return {
      id: subscriber.id,
      userId: subscriber.userId,
      email: subscriber.email,
      firstName: subscriber.user?.firstName || null,
      lastName: subscriber.user?.lastName || null,
      marketingSubscribed,
      subscriptionType: toSubscriptionType(marketingSubscribed),
      source: subscriber.source || null,
      updatedAt: subscriber.updatedAt.toISOString(),
    };
  });

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function updateAdminSubscriber(
  identifier: string,
  updates: {
    marketingEmails?: boolean;
    actorUserId?: string | null;
    requestId?: string | null;
    requestPath?: string | null;
    requestIp?: string | null;
  }
) {
  if (typeof updates.marketingEmails !== "boolean") {
    throw new Error("INVALID_UPDATE");
  }

  const existing = await db.newsletterSubscriber.findFirst({
    where: {
      OR: [{ id: identifier }, { userId: identifier }],
    },
    select: {
      id: true,
      userId: true,
      email: true,
      status: true,
      source: true,
      subscribedAt: true,
      updatedAt: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
  if (!existing) throw new Error("NOT_FOUND");
  if (updates.marketingEmails && existing.status !== "subscribed") {
    throw new Error("SELF_SERVICE_OPT_IN_REQUIRED");
  }

  if (existing.userId) {
    await syncMarketingPreferenceForUser(existing.userId, updates.marketingEmails);
  } else {
    await db.newsletterSubscriber.update({
      where: { id: existing.id },
      data: {
        status: updates.marketingEmails ? "subscribed" : "unsubscribed",
        subscribedAt: updates.marketingEmails ? new Date() : existing.subscribedAt,
        unsubscribedAt: updates.marketingEmails ? null : new Date(),
      },
    });
  }

  const refreshed = await db.newsletterSubscriber.findUnique({
    where: { id: existing.id },
    select: {
      id: true,
      userId: true,
      email: true,
      status: true,
      source: true,
      updatedAt: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
  if (!refreshed) throw new Error("NOT_FOUND");

  const marketingSubscribed = refreshed.status === "subscribed";
  const result = {
    id: refreshed.id,
    userId: refreshed.userId,
    email: refreshed.email,
    firstName: refreshed.user?.firstName || null,
    lastName: refreshed.user?.lastName || null,
    marketingSubscribed,
    subscriptionType: toSubscriptionType(marketingSubscribed),
    source: refreshed.source || null,
    updatedAt: refreshed.updatedAt.toISOString(),
  };

  if (updates.actorUserId) {
    await createAdminActionLog({
      actorUserId: updates.actorUserId,
      actionType: "newsletter_subscriber_updated",
      targetType: "newsletter_subscriber",
      targetId: refreshed.id,
      requestId: updates.requestId,
      requestPath: updates.requestPath,
      requestIp: updates.requestIp,
      oldValueJson: {
        id: existing.id,
        userId: existing.userId,
        email: existing.email,
        status: existing.status,
        source: existing.source,
        updatedAt: existing.updatedAt.toISOString(),
      },
      newValueJson: result,
    });
  }

  return result;
}

function aggregateCampaignRows(
  rows: Array<{ type: string; metadataJson: Prisma.JsonValue | null }>
) {
  let delivered = 0;
  let opened = 0;
  let clicked = 0;
  let bounced = 0;
  let spamComplaints = 0;
  let unsubscribed = 0;
  const topLinks = new Map<string, number>();

  for (const row of rows) {
    switch (row.type.toLowerCase()) {
      case "Delivery":
      case "delivery":
      case "Delivered":
      case "delivered":
        delivered += 1;
        break;
      case "Open":
      case "open":
      case "Opened":
      case "opened":
        opened += 1;
        break;
      case "Click":
      case "click":
      case "Clicked":
      case "clicked":
        clicked += 1;
        break;
      case "Bounce":
      case "bounce":
      case "Bounced":
      case "bounced":
        bounced += 1;
        break;
      case "SpamComplaint":
      case "spamcomplaint":
      case "spam_complaint":
        spamComplaints += 1;
        break;
      case "SubscriptionChange":
      case "subscriptionchange":
      case "Unsubscribe":
      case "unsubscribe":
      case "Unsubscribed":
      case "unsubscribed":
        unsubscribed += 1;
        break;
      default:
        break;
    }

    if (
      (row.type === "Click" || row.type.toLowerCase() === "clicked") &&
      row.metadataJson &&
      typeof row.metadataJson === "object" &&
      !Array.isArray(row.metadataJson)
    ) {
      const maybeUrl = (row.metadataJson as Record<string, unknown>).url;
      if (typeof maybeUrl === "string" && maybeUrl.length > 0) {
        topLinks.set(maybeUrl, (topLinks.get(maybeUrl) || 0) + 1);
      }
    }
  }

  return {
    delivered,
    opened,
    clicked,
    bounced,
    spamComplaints,
    unsubscribed,
    topLinks: Array.from(topLinks.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([url, count]) => ({ url, clicks: count })),
  };
}

export async function getAdminNewsletterSummary(
  params: {
    campaignStatus?: string;
    campaignDateRange?: string;
    campaignPage?: number;
    campaignPageSize?: number;
    audienceDateRange?: string;
    audienceSource?: string;
  } = {}
): Promise<AdminNewsletterSummaryDto> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const audienceRangeStart = getCampaignRangeStart(params.audienceDateRange);
  const audienceRangeEnd = new Date();
  const audienceSource = params.audienceSource?.trim() || "all";
  const audienceSourceWhere =
    audienceSource && audienceSource !== "all" ? { source: audienceSource } : {};
  const campaignPage = Math.max(1, params.campaignPage || 1);
  const campaignPageSize = Math.min(50, Math.max(1, params.campaignPageSize || 10));
  const campaignWhere = buildCampaignWhere({
    status: params.campaignStatus,
    dateRange: params.campaignDateRange,
  });
  const [
    segments,
    subscriberUnsubscribes30d,
    newSubscribers30d,
    verifiedSubscribers30d,
    sourceRows,
    audienceSubscribers,
    audienceEvents,
    influenceCampaigns,
    campaignTotal,
    campaigns,
  ] = await Promise.all([
    getSubscriberSegmentSummary(),
    db.newsletterSubscriber.count({
      where: {
        status: "unsubscribed",
        unsubscribedAt: { gte: thirtyDaysAgo },
      },
    }),
    db.newsletterSubscriber.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    db.newsletterSubscriber.count({
      where: {
        verifiedAt: { gte: thirtyDaysAgo },
      },
    }),
    db.newsletterSubscriber.groupBy({
      by: ["source", "status"],
      _count: { _all: true },
    }),
    db.newsletterSubscriber.findMany({
      where: {
        ...audienceSourceWhere,
        OR: audienceRangeStart
          ? [
              { createdAt: { gte: audienceRangeStart } },
              { verifiedAt: { gte: audienceRangeStart } },
              { unsubscribedAt: { gte: audienceRangeStart } },
            ]
          : undefined,
      },
      select: {
        status: true,
        source: true,
        createdAt: true,
        verifiedAt: true,
        unsubscribedAt: true,
      },
    }),
    db.emailEvent.findMany({
      where: {
        eventAt: audienceRangeStart ? { gte: audienceRangeStart } : undefined,
        type: { in: ["Bounce", "bounce", "Bounced", "bounced", "SpamComplaint", "spamcomplaint"] },
      },
      select: {
        type: true,
        eventAt: true,
      },
    }),
    db.emailCampaign.findMany({
      where: buildCampaignWhere({ dateRange: params.audienceDateRange }),
      orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
      take: 8,
      include: {
        emailEvents: {
          select: { type: true, metadataJson: true },
        },
      },
    }),
    db.emailCampaign.count({ where: campaignWhere }),
    db.emailCampaign.findMany({
      where: campaignWhere,
      orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
      skip: (campaignPage - 1) * campaignPageSize,
      take: campaignPageSize,
      include: {
        emailEvents: {
          select: { type: true, metadataJson: true },
        },
      },
    }),
  ]);

  const sourceMap = new Map<
    string,
    { source: string; total: number; subscribed: number; pending: number; unsubscribed: number }
  >();
  for (const row of sourceRows) {
    const source = row.source || "unknown";
    const existing = sourceMap.get(source) || {
      source,
      total: 0,
      subscribed: 0,
      pending: 0,
      unsubscribed: 0,
    };
    const count = row._count._all;
    existing.total += count;
    if (row.status === "subscribed") existing.subscribed += count;
    if (row.status === "pending") existing.pending += count;
    if (row.status === "unsubscribed") existing.unsubscribed += count;
    sourceMap.set(source, existing);
  }

  const campaignDtos: AdminNewsletterCampaignSummaryDto[] = campaigns.map((campaign) => {
    const agg = aggregateCampaignRows(campaign.emailEvents);
    const totalRecipients = Math.max(
      campaign.sentCount + campaign.failedCount,
      agg.delivered + agg.bounced,
      agg.delivered
    );
    const deliveredOrTotal = Math.max(totalRecipients, 1);
    const delivered = Math.max(agg.delivered, campaign.sentCount - campaign.failedCount, 0);
    return {
      id: campaign.id,
      providerCampaignId: campaign.providerCampaignId,
      subject: campaign.subject,
      status:
        campaign.status === "scheduled" ||
        campaign.status === "sending" ||
        campaign.status === "failed" ||
        campaign.status === "failed_partial"
          ? (campaign.status as "scheduled" | "sending" | "failed" | "failed_partial")
          : "sent",
      sentDate: (campaign.sentAt || campaign.scheduledAt || campaign.createdAt).toISOString(),
      totalRecipients,
      delivered,
      opened: agg.opened,
      clicked: agg.clicked,
      bounced: agg.bounced,
      spamComplaints: agg.spamComplaints,
      unsubscribed: agg.unsubscribed,
      failedSends: campaign.failedCount,
      deliveryRate: toPercent(delivered, deliveredOrTotal),
      openRate: toPercent(agg.opened, Math.max(delivered, 1)),
      clickRate: toPercent(agg.clicked, Math.max(delivered, 1)),
      clickToOpenRate: toPercent(agg.clicked, Math.max(agg.opened, 1)),
      unsubscribeRate: toPercent(agg.unsubscribed, deliveredOrTotal),
      bounceRate: toPercent(agg.bounced, deliveredOrTotal),
      complaintRate: toPercent(agg.spamComplaints, deliveredOrTotal),
      audienceType: campaign.audienceType || null,
      triggeredBy: campaign.triggeredBy || null,
      sourceSystem: getCampaignSourceSystem(campaign),
    };
  });

  const trendBuckets = createTrendBuckets(audienceRangeStart || thirtyDaysAgo, audienceRangeEnd);
  const sourceSegmentMap = new Map<
    string,
    {
      source: string;
      newSubscribers: number;
      verifiedSubscribers: number;
      unsubscribes: number;
      netGrowth: number;
      activeSubscriberCount: number;
    }
  >();

  for (const subscriber of audienceSubscribers) {
    const source = subscriber.source || "unknown";
    const segment = sourceSegmentMap.get(source) || {
      source,
      newSubscribers: 0,
      verifiedSubscribers: 0,
      unsubscribes: 0,
      netGrowth: 0,
      activeSubscriberCount: 0,
    };
    if (subscriber.status === "subscribed") segment.activeSubscriberCount += 1;

    const createdBucket = trendBuckets.get(toDateKey(subscriber.createdAt));
    if (createdBucket) {
      createdBucket.newSubscribers += 1;
      createdBucket.netGrowth += 1;
      segment.newSubscribers += 1;
      segment.netGrowth += 1;
    }

    if (subscriber.verifiedAt) {
      const verifiedBucket = trendBuckets.get(toDateKey(subscriber.verifiedAt));
      if (verifiedBucket) {
        verifiedBucket.verifiedSubscribers += 1;
        segment.verifiedSubscribers += 1;
      }
    }

    if (subscriber.unsubscribedAt) {
      const unsubscribedBucket = trendBuckets.get(toDateKey(subscriber.unsubscribedAt));
      if (unsubscribedBucket) {
        unsubscribedBucket.unsubscribes += 1;
        unsubscribedBucket.netGrowth -= 1;
        segment.unsubscribes += 1;
        segment.netGrowth -= 1;
      }
    }

    sourceSegmentMap.set(source, segment);
  }

  for (const event of audienceEvents) {
    const bucket = trendBuckets.get(toDateKey(event.eventAt));
    if (!bucket) continue;
    const type = event.type.toLowerCase();
    if (type === "bounce" || type === "bounced") bucket.bounces += 1;
    if (type === "spamcomplaint" || type === "spam_complaint") bucket.spamComplaints += 1;
  }

  const campaignInfluence = influenceCampaigns.map((campaign) => {
    const agg = aggregateCampaignRows(campaign.emailEvents);
    return {
      campaignId: campaign.id,
      subject: campaign.subject,
      sentDate: (campaign.sentAt || campaign.scheduledAt || campaign.createdAt).toISOString(),
      sourceSystem: getCampaignSourceSystem(campaign),
      delivered: Math.max(agg.delivered, campaign.sentCount - campaign.failedCount, 0),
      opened: agg.opened,
      clicked: agg.clicked,
      unsubscribed: agg.unsubscribed,
    };
  });

  return {
    totalSubscribers: segments.total,
    subscribed: segments.subscribed,
    unsubscribed: segments.unsubscribed,
    unsubscribes30d: subscriberUnsubscribes30d,
    growth: {
      newSubscribers30d,
      verifiedSubscribers30d,
      unsubscribes30d: subscriberUnsubscribes30d,
      netGrowth30d: newSubscribers30d - subscriberUnsubscribes30d,
      activeSubscriberCount: segments.subscribed,
    },
    sourceAttribution: Array.from(sourceMap.values()).sort((a, b) => b.total - a.total),
    campaigns: campaignDtos,
    campaignsPagination: {
      page: campaignPage,
      pageSize: campaignPageSize,
      total: campaignTotal,
      totalPages: Math.max(1, Math.ceil(campaignTotal / campaignPageSize)),
    },
    audienceReporting: {
      dateRange: params.audienceDateRange || "30d",
      source: audienceSource,
      exportHref: `/admin/newsletter?audienceDateRange=${encodeURIComponent(
        params.audienceDateRange || "30d"
      )}&audienceSource=${encodeURIComponent(audienceSource)}`,
      trend: Array.from(trendBuckets.values()),
      sourceSegments: Array.from(sourceSegmentMap.values()).sort(
        (a, b) => b.newSubscribers - a.newSubscribers
      ),
      campaignInfluence,
    },
  };
}

export async function getAdminNewsletterCampaign(
  id: string
): Promise<AdminNewsletterCampaignDetailDto | null> {
  const campaign = await db.emailCampaign.findUnique({
    where: { id },
    include: {
      emailEvents: {
        select: { type: true, eventAt: true, metadataJson: true },
        orderBy: { eventAt: "asc" },
      },
    },
  });

  if (!campaign) return null;

  const agg = aggregateCampaignRows(campaign.emailEvents);
  const eventTimelineByDate = new Map<
    string,
    { opened: number; clicked: number; bounced: number }
  >();
  for (const row of campaign.emailEvents) {
    const key = row.eventAt.toISOString().slice(0, 10);
    const bucket = eventTimelineByDate.get(key) || { opened: 0, clicked: 0, bounced: 0 };
    const type = row.type.toLowerCase();
    if (type === "open" || type === "opened") bucket.opened += 1;
    if (type === "click" || type === "clicked") bucket.clicked += 1;
    if (type === "bounce" || type === "bounced") bucket.bounced += 1;
    eventTimelineByDate.set(key, bucket);
  }

  const totalRecipients = Math.max(
    campaign.sentCount + campaign.failedCount,
    agg.delivered + agg.bounced,
    agg.delivered
  );
  const delivered = Math.max(agg.delivered, campaign.sentCount - campaign.failedCount, 0);
  const deliveredOrTotal = Math.max(totalRecipients, 1);

  return {
    id: campaign.id,
    providerCampaignId: campaign.providerCampaignId,
    subject: campaign.subject,
    status:
      campaign.status === "scheduled" ||
      campaign.status === "sending" ||
      campaign.status === "failed" ||
      campaign.status === "failed_partial"
        ? (campaign.status as "scheduled" | "sending" | "failed" | "failed_partial")
        : "sent",
    sentDate: (campaign.sentAt || campaign.scheduledAt || campaign.createdAt).toISOString(),
    totalRecipients,
    delivered,
    opened: agg.opened,
    clicked: agg.clicked,
    bounced: agg.bounced,
    spamComplaints: agg.spamComplaints,
    unsubscribed: agg.unsubscribed,
    failedSends: campaign.failedCount,
    deliveryRate: toPercent(delivered, deliveredOrTotal),
    openRate: toPercent(agg.opened, Math.max(delivered, 1)),
    clickRate: toPercent(agg.clicked, Math.max(delivered, 1)),
    clickToOpenRate: toPercent(agg.clicked, Math.max(agg.opened, 1)),
    unsubscribeRate: toPercent(agg.unsubscribed, deliveredOrTotal),
    bounceRate: toPercent(agg.bounced, deliveredOrTotal),
    complaintRate: toPercent(agg.spamComplaints, deliveredOrTotal),
    audienceType: campaign.audienceType || null,
    triggeredBy: campaign.triggeredBy || null,
    sourceSystem: getCampaignSourceSystem(campaign),
    topLinks: agg.topLinks,
    eventTimeline: Array.from(eventTimelineByDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, values]) => ({ date, ...values })),
  };
}
