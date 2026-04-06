import { Prisma } from "@prisma/client";
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
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  audienceType?: string | null;
  triggeredBy?: string | null;
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
  campaigns: AdminNewsletterCampaignSummaryDto[];
};

function toSubscriptionType(marketingSubscribed: boolean): SubscriptionType {
  return marketingSubscribed ? "subscribed" : "unsubscribed";
}

function toPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 1000) / 10;
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
  updates: { marketingEmails?: boolean }
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
  return {
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
    switch (row.type) {
      case "Delivery":
        delivered += 1;
        break;
      case "Open":
        opened += 1;
        break;
      case "Click":
        clicked += 1;
        break;
      case "Bounce":
        bounced += 1;
        break;
      case "SpamComplaint":
        spamComplaints += 1;
        break;
      case "SubscriptionChange":
        unsubscribed += 1;
        break;
      default:
        break;
    }

    if (
      row.type === "Click" &&
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

export async function getAdminNewsletterSummary(): Promise<AdminNewsletterSummaryDto> {
  const [segments, unsubscribes30d, campaigns] = await Promise.all([
    getSubscriberSegmentSummary(),
    db.emailEvent.count({
      where: {
        type: "SubscriptionChange",
        eventAt: { gte: new Date(Date.now() - 30 * 86400000) },
      },
    }),
    db.emailCampaign.findMany({
      orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
      take: 25,
      include: {
        emailEvents: {
          select: { type: true, metadataJson: true },
        },
      },
    }),
  ]);

  const campaignDtos: AdminNewsletterCampaignSummaryDto[] = campaigns.map((campaign) => {
    const agg = aggregateCampaignRows(campaign.emailEvents);
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
      totalRecipients: Math.max(agg.delivered + agg.bounced, agg.delivered),
      delivered: agg.delivered,
      opened: agg.opened,
      clicked: agg.clicked,
      bounced: agg.bounced,
      spamComplaints: agg.spamComplaints,
      unsubscribed: agg.unsubscribed,
      openRate: toPercent(agg.opened, Math.max(agg.delivered, 1)),
      clickRate: toPercent(agg.clicked, Math.max(agg.delivered, 1)),
      clickToOpenRate: toPercent(agg.clicked, Math.max(agg.opened, 1)),
      audienceType: campaign.audienceType || null,
      triggeredBy: campaign.triggeredBy || null,
    };
  });

  return {
    totalSubscribers: segments.total,
    subscribed: segments.subscribed,
    unsubscribed: segments.unsubscribed,
    unsubscribes30d,
    campaigns: campaignDtos,
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
    if (row.type === "Open") bucket.opened += 1;
    if (row.type === "Click") bucket.clicked += 1;
    if (row.type === "Bounce") bucket.bounced += 1;
    eventTimelineByDate.set(key, bucket);
  }

  const totalRecipients = Math.max(agg.delivered + agg.bounced, agg.delivered);

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
    delivered: agg.delivered,
    opened: agg.opened,
    clicked: agg.clicked,
    bounced: agg.bounced,
    spamComplaints: agg.spamComplaints,
    unsubscribed: agg.unsubscribed,
    openRate: toPercent(agg.opened, Math.max(agg.delivered, 1)),
    clickRate: toPercent(agg.clicked, Math.max(agg.delivered, 1)),
    clickToOpenRate: toPercent(agg.clicked, Math.max(agg.opened, 1)),
    audienceType: campaign.audienceType || null,
    triggeredBy: campaign.triggeredBy || null,
    topLinks: agg.topLinks,
    eventTimeline: Array.from(eventTimelineByDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, values]) => ({ date, ...values })),
  };
}
