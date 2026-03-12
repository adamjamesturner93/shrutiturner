import { db } from "@/lib/db";

export type AdminNewsletterCampaignSummary = {
  id: string;
  subject: string;
  status: "sent" | "scheduled";
  sentDate: string;
  totalRecipients: number;
};

export type AdminNewsletterSummary = {
  totalSubscribers: number;
  newsletterSubscribers: number;
  blogSubscribers: number;
  unsubscribes30d: number;
  campaigns: AdminNewsletterCampaignSummary[];
};

export async function getAdminNewsletterSummary(): Promise<AdminNewsletterSummary> {
  const [newsletterSubscribers, blogSubscribers] = await Promise.all([
    db.userNotificationPreference.count({ where: { newsletter: true } }),
    db.userNotificationPreference.count({ where: { blogUpdates: true } }),
  ]);

  return {
    totalSubscribers: newsletterSubscribers + blogSubscribers,
    newsletterSubscribers,
    blogSubscribers,
    unsubscribes30d: 0,
    campaigns: [],
  };
}

export async function getAdminNewsletterCampaign(_id: string): Promise<AdminNewsletterCampaignSummary | null> {
  return null;
}
