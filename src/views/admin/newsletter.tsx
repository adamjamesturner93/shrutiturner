"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Filter, RefreshCcw, Search } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppMetricCard, AppMetricGrid, AppPageHeader } from "@/components/app-surface";

type CampaignSummary = {
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

type NewsletterSummary = {
  totalSubscribers: number;
  subscribed: number;
  unsubscribed: number;
  unsubscribes30d: number;
  campaigns: CampaignSummary[];
};

type SubscriberRow = {
  id: string;
  userId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  marketingSubscribed: boolean;
  subscriptionType: "subscribed" | "unsubscribed";
  source: string | null;
  updatedAt: string;
};

type SubscribersResponse = {
  items: SubscriberRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const FILTERS = ["all", "subscribed", "unsubscribed"] as const;
type FilterType = (typeof FILTERS)[number];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdminNewsletter() {
  const [summary, setSummary] = useState<NewsletterSummary | null>(null);
  const [subscribers, setSubscribers] = useState<SubscribersResponse | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const refreshSummary = async () => {
    const response = await fetch("/api/admin/newsletter", { cache: "no-store" });
    if (!response.ok) return;
    setSummary((await response.json()) as NewsletterSummary);
  };

  const refreshSubscribers = async (nextFilter: FilterType, nextSearch: string) => {
    const query = new URLSearchParams();
    query.set("type", nextFilter);
    query.set("page", "1");
    query.set("pageSize", "50");
    if (nextSearch.trim()) query.set("search", nextSearch.trim());
    const response = await fetch(`/api/admin/newsletter/subscribers?${query.toString()}`, {
      cache: "no-store",
    });
    if (!response.ok) return;
    setSubscribers((await response.json()) as SubscribersResponse);
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        setLoading(true);
        const [summaryResponse, subscribersResponse] = await Promise.all([
          fetch("/api/admin/newsletter", { cache: "no-store" }),
          fetch("/api/admin/newsletter/subscribers?type=all&page=1&pageSize=50", {
            cache: "no-store",
          }),
        ]);

        if (summaryResponse.ok && active) {
          setSummary((await summaryResponse.json()) as NewsletterSummary);
        }
        if (subscribersResponse.ok && active) {
          setSubscribers((await subscribersResponse.json()) as SubscribersResponse);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const updateSubscriber = async (row: SubscriberRow, marketingSubscribed: boolean) => {
    setUpdatingId(row.id);
    try {
      const response = await fetch(
        `/api/admin/newsletter/subscribers/${encodeURIComponent(row.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ marketingEmails: marketingSubscribed }),
        }
      );
      if (!response.ok) return;
      await Promise.all([refreshSubscribers(filter, search), refreshSummary()]);
    } finally {
      setUpdatingId(null);
    }
  };

  const campaigns = useMemo(() => summary?.campaigns || [], [summary]);

  return (
    <AdminLayout title="Newsletter Analytics - Admin">
      <div className="space-y-6">
        <AppPageHeader
          eyebrow="Marketing audience"
          title="Marketing Email Audience"
          description="Unified marketing consent, unsubscribe trends, and recent Postmark campaign results."
          actions={
            <Button
              variant="outline"
              onClick={() =>
                void Promise.all([refreshSummary(), refreshSubscribers(filter, search)])
              }
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          }
        />

        {loading ? <p className="text-muted-foreground text-sm">Loading...</p> : null}

        {summary ? (
          <AppMetricGrid>
            <AppMetricCard
              label="Total subscribers"
              value={summary.totalSubscribers}
              detail="all marketing contacts"
            />
            <AppMetricCard
              label="Subscribed"
              value={summary.subscribed}
              detail="currently opted in"
            />
            <AppMetricCard
              label="Unsubscribed"
              value={summary.unsubscribed}
              detail="currently opted out"
            />
            <AppMetricCard
              label="Unsubs 30d"
              value={summary.unsubscribes30d}
              detail="recent audience loss"
            />
          </AppMetricGrid>
        ) : null}

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="text-brand-accent h-4 w-4" />
              {FILTERS.map((entry) => (
                <Button
                  key={entry}
                  size="sm"
                  variant={filter === entry ? "default" : "outline"}
                  onClick={() => {
                    setFilter(entry);
                    void refreshSubscribers(entry, search);
                  }}
                >
                  {entry}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by email or linked user name"
              />
              <Button
                variant="outline"
                onClick={() => {
                  setSearch(searchInput);
                  void refreshSubscribers(filter, searchInput);
                }}
              >
                <Search className="mr-1 h-4 w-4" />
                Search
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-muted-foreground border-b">
                  <tr>
                    <th className="py-2">Subscriber</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Source</th>
                    <th className="py-2">Updated</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers?.items.map((subscriber) => (
                    <tr key={subscriber.id} className="border-b">
                      <td className="py-3">
                        <p>{subscriber.email}</p>
                        <p className="text-muted-foreground text-xs">
                          {[subscriber.firstName, subscriber.lastName].filter(Boolean).join(" ") ||
                            "No linked profile"}
                        </p>
                      </td>
                      <td className="py-3">
                        <Badge variant={subscriber.marketingSubscribed ? "default" : "outline"}>
                          {subscriber.marketingSubscribed ? "Subscribed" : "Unsubscribed"}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm">{subscriber.source || "Unknown"}</td>
                      <td className="py-3 text-sm">{formatDateTime(subscriber.updatedAt)}</td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === subscriber.id}
                          onClick={() =>
                            void updateSubscriber(subscriber, !subscriber.marketingSubscribed)
                          }
                        >
                          {subscriber.marketingSubscribed ? "Unsubscribe" : "Resubscribe"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg">Recent campaigns</h2>
              <Link href="/admin/newsletter">
                <Button variant="ghost" size="sm">
                  View detail
                </Button>
              </Link>
            </div>

            {campaigns.length === 0 ? (
              <p className="text-muted-foreground text-sm">No campaign data available yet.</p>
            ) : (
              campaigns.slice(0, 8).map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/admin/newsletter/${campaign.id}`}
                  className="hover:bg-secondary/40 block rounded-lg border p-4 transition-colors"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p>{campaign.subject}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatDateTime(campaign.sentDate)} · {campaign.totalRecipients} recipients
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">{campaign.status}</Badge>
                      <Badge variant="outline">Open {campaign.openRate}%</Badge>
                      <Badge variant="outline">Click {campaign.clickRate}%</Badge>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
