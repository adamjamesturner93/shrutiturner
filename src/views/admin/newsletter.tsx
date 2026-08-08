"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronLeft, ChevronRight, Filter, RefreshCcw, Search } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { AppMetricCard, AppMetricGrid, AppPageHeader } from "@/components/app-surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type CampaignSummary = {
  id: string;
  subject: string;
  status: "sent" | "scheduled" | "sending" | "failed" | "failed_partial";
  sentDate: string;
  totalRecipients: number;
  delivered: number;
  spamComplaints: number;
  failedSends: number;
  deliveryRate: number;
  openRate: number | null;
  clickRate: number | null;
  unsubscribeRate: number;
  bounceRate: number;
  complaintRate: number;
  sourceSystem: string;
  messageStream: string | null;
  trackingState: "available" | "awaiting" | "unavailable";
  attentionReasons: string[];
  errorSummary: string | null;
};

type NewsletterSummary = {
  subscribed: number;
  unsubscribes30d: number;
  campaigns: CampaignSummary[];
  campaignsPagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type SubscriberRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  marketingSubscribed: boolean;
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
const CAMPAIGN_STATUSES = [
  "all",
  "sent",
  "scheduled",
  "sending",
  "failed",
  "failed_partial",
] as const;
type CampaignStatusFilter = (typeof CAMPAIGN_STATUSES)[number];
const CAMPAIGN_RANGES = ["7d", "30d", "90d", "all"] as const;
type CampaignDateRange = (typeof CAMPAIGN_RANGES)[number];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRate(rate: number | null, trackingState: CampaignSummary["trackingState"]) {
  if (rate !== null) return `${rate}%`;
  return trackingState === "awaiting" ? "Pending" : "Unavailable";
}

export function AdminNewsletter() {
  const [summary, setSummary] = useState<NewsletterSummary | null>(null);
  const [subscribers, setSubscribers] = useState<SubscribersResponse | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [subscriberPage, setSubscriberPage] = useState(1);
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatusFilter>("all");
  const [campaignDateRange, setCampaignDateRange] = useState<CampaignDateRange>("30d");
  const [campaignPage, setCampaignPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const refreshSummary = useCallback(
    async (options?: {
      status?: CampaignStatusFilter;
      range?: CampaignDateRange;
      page?: number;
    }) => {
      const query = new URLSearchParams({
        campaignStatus: options?.status || campaignStatus,
        campaignDateRange: options?.range || campaignDateRange,
        campaignPage: String(options?.page || campaignPage),
        campaignPageSize: "10",
        audienceDateRange: "30d",
        audienceSource: "all",
      });
      const response = await fetch(`/api/admin/newsletter?${query.toString()}`, {
        cache: "no-store",
      });
      if (response.ok) setSummary((await response.json()) as NewsletterSummary);
    },
    [campaignDateRange, campaignPage, campaignStatus]
  );

  const refreshSubscribers = useCallback(
    async (nextFilter: FilterType, nextSearch: string, page = 1) => {
      const query = new URLSearchParams({
        type: nextFilter,
        page: String(page),
        pageSize: "25",
      });
      if (nextSearch.trim()) query.set("search", nextSearch.trim());
      const response = await fetch(`/api/admin/newsletter/subscribers?${query.toString()}`, {
        cache: "no-store",
      });
      if (response.ok) setSubscribers((await response.json()) as SubscribersResponse);
    },
    []
  );

  useEffect(() => {
    void Promise.all([refreshSummary(), refreshSubscribers("all", "", 1)]).finally(() =>
      setLoading(false)
    );
  }, [refreshSubscribers, refreshSummary]);

  async function updateSubscriber(row: SubscriberRow, marketingSubscribed: boolean) {
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
      await Promise.all([refreshSubscribers(filter, search, subscriberPage), refreshSummary()]);
    } finally {
      setUpdatingId(null);
    }
  }

  function updateCampaignFilters(next: {
    status?: CampaignStatusFilter;
    range?: CampaignDateRange;
    page?: number;
  }) {
    const nextStatus = next.status || campaignStatus;
    const nextRange = next.range || campaignDateRange;
    const nextPage = next.page || 1;
    setCampaignStatus(nextStatus);
    setCampaignDateRange(nextRange);
    setCampaignPage(nextPage);
    void refreshSummary({ status: nextStatus, range: nextRange, page: nextPage });
  }

  function updateSubscriberPage(page: number) {
    setSubscriberPage(page);
    void refreshSubscribers(filter, search, page);
  }

  const campaigns = useMemo(() => summary?.campaigns || [], [summary]);

  return (
    <AdminLayout title="Newsletter Analytics - Admin">
      <div className="space-y-6">
        <AppPageHeader
          eyebrow="Marketing audience"
          title="Marketing Email Audience"
          description="Active consent, recent unsubscribes and campaign delivery for this website's marketing stream."
          actions={
            <Button
              variant="outline"
              onClick={() =>
                void Promise.all([
                  refreshSummary(),
                  refreshSubscribers(filter, search, subscriberPage),
                ])
              }
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          }
        />

        {loading ? <p className="text-muted-foreground text-sm">Loading...</p> : null}

        {summary ? (
          <AppMetricGrid className="lg:grid-cols-2">
            <AppMetricCard
              label="Active subscribers"
              value={summary.subscribed}
              detail="currently opted in"
            />
            <AppMetricCard
              label="Unsubscribed (30d)"
              value={summary.unsubscribes30d}
              detail="recent audience loss"
            />
          </AppMetricGrid>
        ) : null}

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg">Campaign reporting</h2>
                <p className="text-muted-foreground max-w-3xl text-sm">
                  Uses Postmark webhook events for this application's marketing stream. Postmark's
                  server overview also includes transactional email, so its totals are not the same
                  scope.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {CAMPAIGN_RANGES.map((range) => (
                  <Button
                    key={range}
                    size="sm"
                    variant={campaignDateRange === range ? "default" : "outline"}
                    onClick={() => updateCampaignFilters({ range })}
                  >
                    {range === "all" ? "All" : range}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {CAMPAIGN_STATUSES.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={campaignStatus === status ? "default" : "outline"}
                  onClick={() => updateCampaignFilters({ status })}
                >
                  {status.replace("_", " ")}
                </Button>
              ))}
            </div>

            {campaigns.length === 0 ? (
              <p className="text-muted-foreground text-sm">No campaign data available yet.</p>
            ) : (
              campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/admin/newsletter/${campaign.id}`}
                  className={`hover:bg-secondary/40 block rounded-lg border p-4 transition-colors ${
                    campaign.attentionReasons.length > 0 ? "border-red-300 bg-red-50/60" : ""
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{campaign.subject}</p>
                        {campaign.attentionReasons.length > 0 ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {campaign.attentionReasons.length} issue
                            {campaign.attentionReasons.length === 1 ? "" : "s"}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatDateTime(campaign.sentDate)} · {campaign.totalRecipients} recipients
                        · {campaign.sourceSystem}
                      </p>
                      {campaign.attentionReasons.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-xs text-red-800">
                          {campaign.attentionReasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">{campaign.status}</Badge>
                      <Badge variant="outline">Delivered {campaign.delivered}</Badge>
                      <Badge variant="outline">
                        Open {formatRate(campaign.openRate, campaign.trackingState)}
                      </Badge>
                      <Badge variant="outline">
                        Click {formatRate(campaign.clickRate, campaign.trackingState)}
                      </Badge>
                      <Badge variant={campaign.bounceRate >= 5 ? "destructive" : "outline"}>
                        Bounce {campaign.bounceRate}%
                      </Badge>
                      <Badge variant={campaign.complaintRate > 0 ? "destructive" : "outline"}>
                        Spam {campaign.spamComplaints}
                      </Badge>
                      <Badge variant="outline">Unsub {campaign.unsubscribeRate}%</Badge>
                    </div>
                  </div>
                </Link>
              ))
            )}

            {summary?.campaignsPagination ? (
              <Pagination
                page={summary.campaignsPagination.page}
                totalPages={summary.campaignsPagination.totalPages}
                total={summary.campaignsPagination.total}
                label="campaigns"
                onPageChange={(page) => updateCampaignFilters({ page })}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div>
              <h2 className="text-lg">Subscribers</h2>
              <p className="text-muted-foreground text-sm">
                Search active and unsubscribed marketing contacts. Results are limited to 25 per
                page.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="text-brand-accent h-4 w-4" />
              {FILTERS.map((entry) => (
                <Button
                  key={entry}
                  size="sm"
                  variant={filter === entry ? "default" : "outline"}
                  onClick={() => {
                    setFilter(entry);
                    setSubscriberPage(1);
                    void refreshSubscribers(entry, search, 1);
                  }}
                >
                  {entry}
                </Button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setSearch(searchInput);
                setSubscriberPage(1);
                void refreshSubscribers(filter, searchInput, 1);
              }}
            >
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by email or linked user name"
                aria-label="Search subscribers"
              />
              <Button variant="outline" type="submit">
                <Search className="mr-1 h-4 w-4" />
                Search
              </Button>
            </form>

            <div className="max-h-[32rem] overflow-auto rounded border">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <thead className="bg-background text-muted-foreground sticky top-0 z-10 border-b">
                  <tr>
                    <th className="p-3">Subscriber</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Updated</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers?.items.map((subscriber) => (
                    <tr key={subscriber.id} className="border-b">
                      <td className="p-3">
                        <p>{subscriber.email}</p>
                        <p className="text-muted-foreground text-xs">
                          {[subscriber.firstName, subscriber.lastName].filter(Boolean).join(" ") ||
                            "No linked profile"}
                        </p>
                      </td>
                      <td className="p-3">
                        <Badge variant={subscriber.marketingSubscribed ? "default" : "outline"}>
                          {subscriber.marketingSubscribed ? "Subscribed" : "Unsubscribed"}
                        </Badge>
                      </td>
                      <td className="p-3">{subscriber.source || "Unknown"}</td>
                      <td className="p-3">{formatDateTime(subscriber.updatedAt)}</td>
                      <td className="p-3">
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
            {subscribers ? (
              <Pagination
                page={subscribers.page}
                totalPages={subscribers.totalPages}
                total={subscribers.total}
                label="subscribers"
                onPageChange={updateSubscriberPage}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  label,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  label: string;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p className="text-muted-foreground text-sm">
        Page {page} of {Math.max(totalPages, 1)} · {total} {label}
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
