"use client";

import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import Link from "next/link";
import {
  Mail,
  Eye,
  MousePointerClick,
  Users,
  TrendingUp,
  ChevronRight,
  BookOpen,
  Bell,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  newsletterCampaigns,
  newsletterAggregateStats,
  type NewsletterCampaign,
} from "../../data/admin-data";

export function AdminNewsletter() {
  const stats = newsletterAggregateStats;
  const sentCampaigns = newsletterCampaigns.filter((c) => c.status === "sent");
  const scheduledCampaigns = newsletterCampaigns.filter((c) => c.status === "scheduled");

  // Chart data
  const campaignPerformance = sentCampaigns
    .slice()
    .reverse()
    .map((c) => ({
      name: c.sentDate.slice(5),
      openRate: c.openRate,
      clickRate: c.clickRate,
    }));

  return (
    <AdminLayout title="Newsletter Analytics - Admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl text-[#2E1F33]">Newsletter Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Postmark campaign performance and subscriber insights
          </p>
        </div>

        {/* Aggregate stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-[#4B5B32]" />
                <div>
                  <p className="text-2xl text-[#2E1F33]">{stats.totalSubscribers}</p>
                  <p className="text-muted-foreground text-xs">Total subscribers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-[#4B5B32]" />
                <div>
                  <p className="text-2xl text-[#2E1F33]">{stats.avgOpenRate}%</p>
                  <p className="text-muted-foreground text-xs">Avg. open rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MousePointerClick className="h-5 w-5 text-[#4B5B32]" />
                <div>
                  <p className="text-2xl text-[#2E1F33]">{stats.avgClickRate}%</p>
                  <p className="text-muted-foreground text-xs">Avg. click rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-[#4B5B32]" />
                <div>
                  <p className="text-2xl text-[#2E1F33]">{stats.avgClickToOpenRate}%</p>
                  <p className="text-muted-foreground text-xs">Click-to-open rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscriber breakdown */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-[#4B5B32]" />
                <div>
                  <p className="text-xl text-[#2E1F33]">{stats.newsletterSubscribers}</p>
                  <p className="text-muted-foreground text-xs">Newsletter subscribers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-[#4B5B32]" />
                <div>
                  <p className="text-xl text-[#2E1F33]">{stats.blogSubscribers}</p>
                  <p className="text-muted-foreground text-xs">Blog notification subscribers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-xl text-[#2E1F33]">{stats.unsubscribes30d}</p>
                  <p className="text-muted-foreground text-xs">Unsubscribes (30 days)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Open/Click rate over time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campaign Performance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={campaignPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(46,31,51,0.1)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} unit="%" />
                    <Tooltip formatter={(value: number) => [`${value}%`]} />
                    <Line
                      type="monotone"
                      dataKey="openRate"
                      stroke="#4B5B32"
                      strokeWidth={2}
                      dot={{ fill: "#4B5B32", r: 4 }}
                      name="Open rate"
                    />
                    <Line
                      type="monotone"
                      dataKey="clickRate"
                      stroke="#B5C49B"
                      strokeWidth={2}
                      dot={{ fill: "#B5C49B", r: 4 }}
                      name="Click rate"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Subscriber growth */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subscriber Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.subscriberGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(46,31,51,0.1)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4B5B32" radius={[4, 4, 0, 0]} name="Subscribers" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scheduled campaigns */}
        {scheduledCampaigns.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg text-[#2E1F33]">Scheduled</h2>
            {scheduledCampaigns.map((campaign) => (
              <CampaignRow key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}

        {/* Sent campaigns */}
        <div className="space-y-3">
          <h2 className="text-lg text-[#2E1F33]">Recent Campaigns</h2>
          {sentCampaigns.map((campaign) => (
            <CampaignRow key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

function CampaignRow({ campaign }: { campaign: NewsletterCampaign }) {
  return (
    <Link href={`/admin/newsletter/${campaign.id}`}>
      <Card className="cursor-pointer transition-colors hover:border-[#4B5B32]/30">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                campaign.type === "newsletter" ? "bg-[#4B5B32]/10" : "bg-[#2E1F33]/10"
              }`}
            >
              {campaign.type === "newsletter" ? (
                <Mail className="h-5 w-5 text-[#4B5B32]" />
              ) : (
                <BookOpen className="h-5 w-5 text-[#2E1F33]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm">{campaign.subject}</p>
                <Badge variant="outline" className="text-xs capitalize">
                  {campaign.type.replace("-", " ")}
                </Badge>
                {campaign.status === "scheduled" && <Badge variant="secondary">Scheduled</Badge>}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {campaign.status === "sent"
                  ? `Sent ${new Date(campaign.sentDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })} · ${campaign.totalRecipients} recipients`
                  : `Scheduled for ${new Date(campaign.sentDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })} · ${campaign.totalRecipients} recipients`}
              </p>
            </div>
            {campaign.status === "sent" && (
              <div className="text-muted-foreground hidden items-center gap-6 text-sm md:flex">
                <div className="text-center">
                  <p className="text-[#2E1F33]">{campaign.openRate}%</p>
                  <p className="text-xs">opens</p>
                </div>
                <div className="text-center">
                  <p className="text-[#2E1F33]">{campaign.clickRate}%</p>
                  <p className="text-xs">clicks</p>
                </div>
              </div>
            )}
            <ChevronRight className="text-muted-foreground h-4 w-4 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
