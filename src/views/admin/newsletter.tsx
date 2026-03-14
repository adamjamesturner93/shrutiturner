"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Bell, BookOpen, Filter, Search, Users } from "lucide-react";
import type { AdminSubscriberDto, AdminNewsletterCampaignDetailDto } from "@/lib/api/types";

type NewsletterSummary = {
  totalSubscribers: number;
  newsletterSubscribers: number;
  blogSubscribers: number;
  bothSubscribers: number;
  neitherSubscribers: number;
  unsubscribes30d: number;
  campaigns: Array<Omit<AdminNewsletterCampaignDetailDto, "topLinks" | "eventTimeline">>;
};

type SubscribersResponse = {
  items: AdminSubscriberDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const FILTERS = ["all", "newsletter", "blog", "both", "neither"] as const;
type FilterType = (typeof FILTERS)[number];

function subscriptionBadge(type: AdminSubscriberDto["subscriptionType"]) {
  if (type === "both") return <Badge className="bg-brand-accent text-brand-white">Both</Badge>;
  if (type === "newsletter") return <Badge variant="secondary">Newsletter</Badge>;
  if (type === "blog") return <Badge variant="outline">Blog</Badge>;
  return <Badge variant="outline">Neither</Badge>;
}

export function AdminNewsletter() {
  const [summary, setSummary] = useState<NewsletterSummary | null>(null);
  const [subscribers, setSubscribers] = useState<SubscribersResponse | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const refreshSubscribers = async (nextFilter: FilterType, nextSearch: string) => {
    const query = new URLSearchParams();
    query.set("type", nextFilter);
    query.set("page", "1");
    query.set("pageSize", "50");
    if (nextSearch.trim()) query.set("search", nextSearch.trim());
    const res = await fetch(`/api/admin/newsletter/subscribers?${query.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const payload = (await res.json()) as SubscribersResponse;
    setSubscribers(payload);
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        setLoading(true);
        const [summaryRes, subscribersRes] = await Promise.all([
          fetch("/api/admin/newsletter", { cache: "no-store" }),
          fetch("/api/admin/newsletter/subscribers?type=all&page=1&pageSize=50", {
            cache: "no-store",
          }),
        ]);
        if (summaryRes.ok && active) {
          setSummary((await summaryRes.json()) as NewsletterSummary);
        }
        if (subscribersRes.ok && active) {
          setSubscribers((await subscribersRes.json()) as SubscribersResponse);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const onApplySearch = async () => {
    setSearch(searchInput);
    await refreshSubscribers(filter, searchInput);
  };

  const onFilterChange = async (next: FilterType) => {
    setFilter(next);
    await refreshSubscribers(next, search);
  };

  const updateSubscriber = async (
    item: AdminSubscriberDto,
    updates: Partial<Pick<AdminSubscriberDto, "newsletterSubscribed" | "blogSubscribed">>
  ) => {
    setUpdatingUserId(item.userId);
    try {
      const res = await fetch(
        `/api/admin/newsletter/subscribers/${encodeURIComponent(item.userId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newsletter:
              typeof updates.newsletterSubscribed === "boolean"
                ? updates.newsletterSubscribed
                : item.newsletterSubscribed,
            blogUpdates:
              typeof updates.blogSubscribed === "boolean"
                ? updates.blogSubscribed
                : item.blogSubscribed,
          }),
        }
      );
      if (!res.ok) return;
      await refreshSubscribers(filter, search);
      const summaryRes = await fetch("/api/admin/newsletter", { cache: "no-store" });
      if (summaryRes.ok) setSummary((await summaryRes.json()) as NewsletterSummary);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const campaigns = useMemo(() => summary?.campaigns || [], [summary]);

  return (
    <AdminLayout title="Newsletter Analytics - Admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-brand-dark text-2xl">Newsletter Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Campaign performance and subscriber preferences.
          </p>
        </div>

        {loading ? <p className="text-muted-foreground text-sm">Loading...</p> : null}

        {summary ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-brand-dark text-2xl">{summary.totalSubscribers}</p>
                  <p className="text-muted-foreground text-xs">Total</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Bell className="text-brand-accent mx-auto mb-1 h-4 w-4" />
                  <p className="text-xl">{summary.newsletterSubscribers}</p>
                  <p className="text-muted-foreground text-xs">Newsletter</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <BookOpen className="text-brand-accent mx-auto mb-1 h-4 w-4" />
                  <p className="text-xl">{summary.blogSubscribers}</p>
                  <p className="text-muted-foreground text-xs">Blog</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xl">{summary.bothSubscribers}</p>
                  <p className="text-muted-foreground text-xs">Both</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xl">{summary.neitherSubscribers}</p>
                  <p className="text-muted-foreground text-xs">Neither</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="text-brand-accent mx-auto mb-1 h-4 w-4" />
                  <p className="text-xl">{summary.unsubscribes30d}</p>
                  <p className="text-muted-foreground text-xs">Unsubs 30d</p>
                </div>
              </CardContent>
            </Card>
          </div>
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
                    void onFilterChange(entry);
                  }}
                >
                  {entry}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or email"
              />
              <Button variant="outline" onClick={() => void onApplySearch()}>
                <Search className="mr-1 h-4 w-4" />
                Search
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-muted-foreground border-b">
                  <tr>
                    <th className="py-2">Subscriber</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Newsletter</th>
                    <th className="py-2">Blog</th>
                  </tr>
                </thead>
                <tbody>
                  {(subscribers?.items || []).map((item) => (
                    <tr key={item.userId} className="border-b last:border-0">
                      <td className="py-2">
                        <p>
                          {item.firstName || item.lastName
                            ? `${item.firstName || ""} ${item.lastName || ""}`.trim()
                            : item.email}
                        </p>
                        <p className="text-muted-foreground text-xs">{item.email}</p>
                      </td>
                      <td className="py-2">{subscriptionBadge(item.subscriptionType)}</td>
                      <td className="py-2">
                        <Button
                          size="sm"
                          variant={item.newsletterSubscribed ? "default" : "outline"}
                          disabled={updatingUserId === item.userId}
                          onClick={() =>
                            void updateSubscriber(item, {
                              newsletterSubscribed: !item.newsletterSubscribed,
                            })
                          }
                        >
                          {item.newsletterSubscribed ? "On" : "Off"}
                        </Button>
                      </td>
                      <td className="py-2">
                        <Button
                          size="sm"
                          variant={item.blogSubscribed ? "default" : "outline"}
                          disabled={updatingUserId === item.userId}
                          onClick={() =>
                            void updateSubscriber(item, { blogSubscribed: !item.blogSubscribed })
                          }
                        >
                          {item.blogSubscribed ? "On" : "Off"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {subscribers && subscribers.items.length === 0 ? (
                    <tr>
                      <td className="text-muted-foreground py-6 text-center" colSpan={4}>
                        No subscribers found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-6">
            <h2 className="text-brand-dark text-lg">Recent Campaigns</h2>
            {campaigns.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No campaign telemetry yet. Send a campaign to populate this list.
              </p>
            ) : (
              campaigns.map((campaign) => (
                <div key={campaign.id} className="rounded border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/admin/newsletter/${campaign.id}`}
                      className="hover:text-brand-accent block min-w-0 flex-1 transition-colors"
                    >
                      <p>{campaign.subject}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(campaign.sentDate).toLocaleDateString("en-GB")} ·{" "}
                        {campaign.totalRecipients} recipients
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {campaign.audienceType ? (
                          <Badge variant="outline">{campaign.audienceType}</Badge>
                        ) : null}
                        {campaign.triggeredBy ? (
                          <Badge variant="secondary">{campaign.triggeredBy}</Badge>
                        ) : null}
                        <Badge
                          variant={
                            campaign.status === "failed" || campaign.status === "failed_partial"
                              ? "destructive"
                              : campaign.status === "sending"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                    </Link>
                    <div className="text-muted-foreground text-right text-xs">
                      <p>Open {campaign.openRate}%</p>
                      <p>Click {campaign.clickRate}%</p>
                      {campaign.status === "failed" || campaign.status === "failed_partial" ? (
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={async () => {
                            await fetch(
                              `/api/admin/newsletter/campaigns/${encodeURIComponent(campaign.id)}/retry`,
                              {
                                method: "POST",
                              }
                            );
                            const summaryRes = await fetch("/api/admin/newsletter", {
                              cache: "no-store",
                            });
                            if (summaryRes.ok) {
                              setSummary((await summaryRes.json()) as NewsletterSummary);
                            }
                          }}
                        >
                          Retry
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
