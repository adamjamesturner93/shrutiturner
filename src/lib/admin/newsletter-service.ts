import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type SubscriptionType = "newsletter" | "blog" | "both" | "neither";

export type AdminSubscriberDto = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  newsletterSubscribed: boolean;
  blogSubscribed: boolean;
  subscriptionType: SubscriptionType;
  updatedAt: string;
};

export type AdminSubscriberSegmentSummaryDto = {
  newsletter: number;
  blog: number;
  both: number;
  neither: number;
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
  newsletterSubscribers: number;
  blogSubscribers: number;
  bothSubscribers: number;
  neitherSubscribers: number;
  unsubscribes30d: number;
  campaigns: AdminNewsletterCampaignSummaryDto[];
};

function toSubscriptionType(newsletter: boolean, blog: boolean): SubscriptionType {
  if (newsletter && blog) return "both";
  if (newsletter) return "newsletter";
  if (blog) return "blog";
  return "neither";
}

function toPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 1000) / 10;
}

export async function getSubscriberSegmentSummary(): Promise<AdminSubscriberSegmentSummaryDto> {
  const [subscribed, unsubscribed] = await Promise.all([
    db.user.count({
      where: {
        role: "student",
        OR: [
          { notificationPreference: { is: null } },
          { notificationPreference: { is: { marketingEmails: true } } },
        ],
      },
    }),
    db.user.count({
      where: {
        role: "student",
        notificationPreference: { is: { marketingEmails: false } },
      },
    }),
  ]);

  return {
    newsletter: subscribed,
    blog: 0,
    both: 0,
    neither: unsubscribed,
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

  const typeWhere: Prisma.UserWhereInput | undefined =
    type === "neither"
      ? { notificationPreference: { is: { marketingEmails: false } } }
      : type === "newsletter" || type === "blog" || type === "both"
        ? {
            OR: [
              { notificationPreference: { is: null } },
              { notificationPreference: { is: { marketingEmails: true } } },
            ],
          }
        : undefined;

  const where: Prisma.UserWhereInput = {
    role: "student",
    ...typeWhere,
    OR: search
      ? [
          { email: { contains: search, mode: "insensitive" } },
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
        ]
      : undefined,
  };

  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        notificationPreference: true,
      },
    }),
  ]);

  const items: AdminSubscriberDto[] = users.map((user) => {
    const prefs = user.notificationPreference;
    const newsletterSubscribed = prefs ? prefs.marketingEmails : true;
    const blogSubscribed = false;
    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      newsletterSubscribed,
      blogSubscribed,
      subscriptionType: toSubscriptionType(newsletterSubscribed, blogSubscribed),
      updatedAt: (prefs?.updatedAt || new Date(0)).toISOString(),
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
  userId: string,
  updates: { newsletter?: boolean; blogUpdates?: boolean; marketingEmails?: boolean }
) {
  const existing = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, notificationPreference: true },
  });
  if (!existing) {
    throw new Error("NOT_FOUND");
  }

  const record = await db.userNotificationPreference.upsert({
    where: { userId },
    create: {
      userId,
      marketingEmails: updates.marketingEmails ?? updates.newsletter ?? updates.blogUpdates ?? true,
      classReminders: true,
      scheduleUpdates: true,
      programAnnouncements: true,
    },
    update: {
      marketingEmails:
        typeof updates.marketingEmails === "boolean"
          ? updates.marketingEmails
          : typeof updates.newsletter === "boolean"
          ? updates.newsletter
          : typeof updates.blogUpdates === "boolean"
            ? updates.blogUpdates
            : undefined,
    },
  });

  const newsletterSubscribed = record.marketingEmails;
  const blogSubscribed = false;
  return {
    userId,
    newsletterSubscribed,
    blogSubscribed,
    subscriptionType: toSubscriptionType(newsletterSubscribed, blogSubscribed),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function aggregateCampaignRows(rows: Array<{ type: string; metadataJson: Prisma.JsonValue | null }>) {
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

    if (row.type === "Click" && row.metadataJson && typeof row.metadataJson === "object" && !Array.isArray(row.metadataJson)) {
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
    newsletterSubscribers: segments.newsletter + segments.both,
    blogSubscribers: segments.blog + segments.both,
    bothSubscribers: segments.both,
    neitherSubscribers: segments.neither,
    unsubscribes30d,
    campaigns: campaignDtos,
  };
}

export async function getAdminNewsletterCampaign(id: string): Promise<AdminNewsletterCampaignDetailDto | null> {
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
  const eventTimelineByDate = new Map<string, { opened: number; clicked: number; bounced: number }>();
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
