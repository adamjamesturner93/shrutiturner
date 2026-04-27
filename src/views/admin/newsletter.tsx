"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronLeft, ChevronRight, Filter, RefreshCcw, Search } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

type NewsletterSummary = {
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
  campaigns: CampaignSummary[];
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
const CAMPAIGN_STATUSES = [
  "all",
  "sent",
  "scheduled",
  "sending",
  "failed",
  "failed_partial",
] as const;
type CampaignStatusFilter = (typeof CAMPAIGN_STATUSES)[number];
const CAMPAIGN_RANGES = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "all", label: "All" },
  { value: "custom", label: "Custom" },
] as const;
type CampaignDateRange = (typeof CAMPAIGN_RANGES)[number]["value"];

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
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatusFilter>("all");
  const [campaignDateRange, setCampaignDateRange] = useState<CampaignDateRange>("30d");
  const [campaignPage, setCampaignPage] = useState(1);
  const [audienceDateRange, setAudienceDateRange] = useState<CampaignDateRange>("30d");
  const [audienceSource, setAudienceSource] = useState("all");
  const [audienceStart, setAudienceStart] = useState("");
  const [audienceEnd, setAudienceEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const refreshSummary = async (options?: {
    status?: CampaignStatusFilter;
    range?: CampaignDateRange;
    page?: number;
    audienceRange?: CampaignDateRange;
    source?: string;
    audienceStart?: string;
    audienceEnd?: string;
  }) => {
    const status = options?.status || campaignStatus;
    const range = options?.range || campaignDateRange;
    const page = options?.page || campaignPage;
    const nextAudienceRange = options?.audienceRange || audienceDateRange;
    const source = options?.source || audienceSource;
    const start = options?.audienceStart ?? audienceStart;
    const end = options?.audienceEnd ?? audienceEnd;
    const query = new URLSearchParams({
      campaignStatus: status,
      campaignDateRange: range,
      campaignPage: String(page),
      campaignPageSize: "10",
      audienceDateRange: nextAudienceRange,
      audienceSource: source,
    });
    if (nextAudienceRange === "custom") {
      if (start) query.set("audienceStart", start);
      if (end) query.set("audienceEnd", end);
    }
    const response = await fetch(`/api/admin/newsletter?${query.toString()}`, {
      cache: "no-store",
    });
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
          fetch(
            "/api/admin/newsletter?campaignStatus=all&campaignDateRange=30d&campaignPage=1&campaignPageSize=10&audienceDateRange=30d&audienceSource=all",
            { cache: "no-store" }
          ),
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
  const campaignPagination = summary?.campaignsPagination;

  const updateCampaignFilters = (next: {
    status?: CampaignStatusFilter;
    range?: CampaignDateRange;
    page?: number;
  }) => {
    const nextStatus = next.status || campaignStatus;
    const nextRange = next.range || campaignDateRange;
    const nextPage = next.page || 1;
    setCampaignStatus(nextStatus);
    setCampaignDateRange(nextRange);
    setCampaignPage(nextPage);
    void refreshSummary({ status: nextStatus, range: nextRange, page: nextPage });
  };

  const updateAudienceFilters = (next: {
    range?: CampaignDateRange;
    source?: string;
    start?: string;
    end?: string;
  }) => {
    const nextRange = next.range || audienceDateRange;
    const nextSource = next.source || audienceSource;
    const nextStart = next.start ?? audienceStart;
    const nextEnd = next.end ?? audienceEnd;
    setAudienceDateRange(nextRange);
    setAudienceSource(nextSource);
    setAudienceStart(nextStart);
    setAudienceEnd(nextEnd);
    void refreshSummary({
      audienceRange: nextRange,
      source: nextSource,
      audienceStart: nextStart,
      audienceEnd: nextEnd,
    });
  };

  const campaignNeedsAttention = (campaign: CampaignSummary) =>
    campaign.status === "failed" ||
    campaign.status === "failed_partial" ||
    campaign.failedSends > 0 ||
    campaign.bounceRate >= 5 ||
    campaign.complaintRate > 0;

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
            <AppMetricCard
              label="Net growth 30d"
              value={summary.growth.netGrowth30d}
              detail={`${summary.growth.newSubscribers30d} new, ${summary.growth.unsubscribes30d} left`}
            />
            <AppMetricCard
              label="Verified 30d"
              value={summary.growth.verifiedSubscribers30d}
              detail="confirmed subscribers"
            />
          </AppMetricGrid>
        ) : null}

        {summary ? (
          <Card>
            <CardContent className="space-y-5 pt-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-lg">Subscriber growth and source attribution</h2>
                  <p className="text-muted-foreground text-sm">
                    New, verified, unsubscribed, bounce, and complaint trends by signup source.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CAMPAIGN_RANGES.map((range) => (
                    <Button
                      key={range.value}
                      size="sm"
                      variant={audienceDateRange === range.value ? "default" : "outline"}
                      onClick={() => updateAudienceFilters({ range: range.value })}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={audienceSource === "all" ? "default" : "outline"}
                  onClick={() => updateAudienceFilters({ source: "all" })}
                >
                  All sources
                </Button>
                {summary.sourceAttribution.slice(0, 8).map((source) => (
                  <Button
                    key={source.source}
                    size="sm"
                    variant={audienceSource === source.source ? "default" : "outline"}
                    onClick={() => updateAudienceFilters({ source: source.source })}
                  >
                    {source.source}
                  </Button>
                ))}
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
                <div className="h-72 rounded border p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={summary.audienceReporting.trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="newSubscribers"
                        name="New"
                        stroke="#2563eb"
                        fill="#93c5fd"
                      />
                      <Area
                        type="monotone"
                        dataKey="verifiedSubscribers"
                        name="Verified"
                        stroke="#16a34a"
                        fill="#86efac"
                      />
                      <Area
                        type="monotone"
                        dataKey="unsubscribes"
                        name="Unsubscribes"
                        stroke="#dc2626"
                        fill="#fecaca"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-72 rounded border p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.audienceReporting.trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="bounces" name="Bounces" fill="#f97316" />
                      <Bar dataKey="spamComplaints" name="Spam" fill="#dc2626" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-muted-foreground border-b">
                    <tr>
                      <th className="py-2">Source</th>
                      <th className="py-2">New</th>
                      <th className="py-2">Verified</th>
                      <th className="py-2">Unsubscribed</th>
                      <th className="py-2">Net</th>
                      <th className="py-2">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.audienceReporting.sourceSegments.map((source) => (
                      <tr key={source.source} className="border-b">
                        <td className="py-3">{source.source}</td>
                        <td className="py-3">{source.newSubscribers}</td>
                        <td className="py-3">{source.verifiedSubscribers}</td>
                        <td className="py-3">{source.unsubscribes}</td>
                        <td className="py-3">{source.netGrowth}</td>
                        <td className="py-3">{source.activeSubscriberCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Campaign influence</h3>
                {summary.audienceReporting.campaignInfluence.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No campaign influence data for this range.
                  </p>
                ) : (
                  summary.audienceReporting.campaignInfluence.map((campaign) => (
                    <div
                      key={campaign.campaignId}
                      className="grid gap-2 rounded border p-3 text-sm md:grid-cols-[1fr_repeat(4,auto)]"
                    >
                      <span className="truncate">{campaign.subject}</span>
                      <span>{campaign.sourceSystem}</span>
                      <span>Delivered {campaign.delivered}</span>
                      <span>Clicked {campaign.clicked}</span>
                      <span>Unsub {campaign.unsubscribed}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
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

        {summary ? (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <h2 className="text-lg">Source attribution</h2>
                <p className="text-muted-foreground text-sm">
                  Subscriber list health grouped by captured signup source.
                </p>
              </div>
              {summary.sourceAttribution.length === 0 ? (
                <p className="text-muted-foreground text-sm">No source data available yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-muted-foreground border-b">
                      <tr>
                        <th className="py-2">Source</th>
                        <th className="py-2">Total</th>
                        <th className="py-2">Subscribed</th>
                        <th className="py-2">Pending</th>
                        <th className="py-2">Unsubscribed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.sourceAttribution.map((source) => (
                        <tr key={source.source} className="border-b">
                          <td className="py-3">{source.source}</td>
                          <td className="py-3">{source.total}</td>
                          <td className="py-3">{source.subscribed}</td>
                          <td className="py-3">{source.pending}</td>
                          <td className="py-3">{source.unsubscribed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg">Campaign reporting</h2>
                <p className="text-muted-foreground text-sm">
                  Delivered, opened, clicked, bounced, unsubscribed, and complaint outcomes.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {CAMPAIGN_RANGES.map((range) => (
                  <Button
                    key={range.value}
                    size="sm"
                    variant={campaignDateRange === range.value ? "default" : "outline"}
                    onClick={() => updateCampaignFilters({ range: range.value })}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>

            {audienceDateRange === "custom" ? (
              <div className="grid gap-3 md:grid-cols-[minmax(0,12rem)_minmax(0,12rem)_auto]">
                <Input
                  type="date"
                  value={audienceStart}
                  onChange={(event) => setAudienceStart(event.target.value)}
                  aria-label="Audience report start date"
                />
                <Input
                  type="date"
                  value={audienceEnd}
                  onChange={(event) => setAudienceEnd(event.target.value)}
                  aria-label="Audience report end date"
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    updateAudienceFilters({
                      range: "custom",
                      start: audienceStart,
                      end: audienceEnd,
                    })
                  }
                >
                  Apply dates
                </Button>
              </div>
            ) : null}

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
                    campaignNeedsAttention(campaign) ? "border-red-300 bg-red-50/60" : ""
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p>{campaign.subject}</p>
                        {campaignNeedsAttention(campaign) ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Attention
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatDateTime(campaign.sentDate)} · {campaign.totalRecipients} recipients
                        · {campaign.sourceSystem}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">{campaign.status}</Badge>
                      <Badge variant="outline">Delivered {campaign.delivered}</Badge>
                      <Badge variant="outline">Open {campaign.openRate}%</Badge>
                      <Badge variant="outline">Click {campaign.clickRate}%</Badge>
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
            {campaignPagination ? (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-muted-foreground text-sm">
                  Page {campaignPagination.page} of {campaignPagination.totalPages} ·{" "}
                  {campaignPagination.total} campaigns
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={campaignPagination.page <= 1}
                    onClick={() => updateCampaignFilters({ page: campaignPagination.page - 1 })}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={campaignPagination.page >= campaignPagination.totalPages}
                    onClick={() => updateCampaignFilters({ page: campaignPagination.page + 1 })}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
