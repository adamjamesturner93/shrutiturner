"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  ArrowLeft,
  Mail,
  Eye,
  MousePointerClick,
  Users,
  Send,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { newsletterCampaigns } from "../../data/admin-data";

export function AdminCampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const navigate = (href: string, opts?: { replace?: boolean }) =>
    opts?.replace ? router.replace(href) : router.push(href);
  const campaign = newsletterCampaigns.find((c) => c.id === id);

  if (!campaign) {
    return (
      <AdminLayout title="Campaign Not Found - Admin">
        <div className="text-center py-20">
          <p className="text-muted-foreground">Campaign not found.</p>
          <Link href="/admin/newsletter">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Newsletter
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const isScheduled = campaign.status === "scheduled";

  return (
    <AdminLayout title={`${campaign.subject} - Admin`}>
      <div className="space-y-6">
        {/* Back nav */}
        <button
          onClick={() => navigate("/admin/newsletter")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Newsletter
        </button>

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl text-[#2E1F33]">{campaign.subject}</h1>
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Badge variant="outline" className="capitalize">
              {campaign.type === "newsletter" ? (
                <Mail className="w-3 h-3 mr-1" />
              ) : (
                <BookOpen className="w-3 h-3 mr-1" />
              )}
              {campaign.type.replace("-", " ")}
            </Badge>
            <Badge variant={isScheduled ? "secondary" : "default"}>
              {isScheduled ? "Scheduled" : "Sent"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {isScheduled ? "Scheduled for" : "Sent on"}{" "}
              {new Date(campaign.sentDate).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {isScheduled ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Send className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg text-[#2E1F33]">Campaign scheduled</p>
              <p className="text-sm text-muted-foreground mt-1">
                This campaign will be sent to {campaign.totalRecipients}{" "}
                recipients on{" "}
                {new Date(campaign.sentDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                })}
                .
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Analytics will be available after sending.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Delivery stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Send className="w-5 h-5 text-[#4B5B32] mx-auto" />
                  <p className="text-2xl text-[#2E1F33] mt-2">
                    {campaign.delivered}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Delivered (of {campaign.totalRecipients})
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Eye className="w-5 h-5 text-[#4B5B32] mx-auto" />
                  <p className="text-2xl text-[#2E1F33] mt-2">
                    {campaign.uniqueOpens}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Unique opens ({campaign.openRate}%)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <MousePointerClick className="w-5 h-5 text-[#4B5B32] mx-auto" />
                  <p className="text-2xl text-[#2E1F33] mt-2">
                    {campaign.uniqueClicks}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Unique clicks ({campaign.clickRate}%)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="w-5 h-5 text-[#4B5B32] mx-auto" />
                  <p className="text-2xl text-[#2E1F33] mt-2">
                    {campaign.clickToOpenRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click-to-open rate
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Engagement funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Engagement Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      label: "Delivered",
                      value: campaign.delivered,
                      total: campaign.totalRecipients,
                      color: "bg-[#B5C49B]",
                    },
                    {
                      label: "Opened",
                      value: campaign.uniqueOpens,
                      total: campaign.delivered,
                      color: "bg-[#4B5B32]",
                    },
                    {
                      label: "Clicked",
                      value: campaign.uniqueClicks,
                      total: campaign.delivered,
                      color: "bg-[#2E1F33]",
                    },
                  ].map((step) => (
                    <div key={step.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{step.label}</span>
                        <span className="text-muted-foreground">
                          {step.value} (
                          {((step.value / step.total) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-6 bg-secondary rounded-md overflow-hidden">
                        <div
                          className={`h-full ${step.color} rounded-md transition-all flex items-center px-2`}
                          style={{
                            width: `${Math.max(
                              (step.value / campaign.totalRecipients) * 100,
                              2
                            )}%`,
                          }}
                        >
                          <span className="text-xs text-white">
                            {step.value}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top links + issues side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Links</CardTitle>
                </CardHeader>
                <CardContent>
                  {campaign.topLinks.length > 0 ? (
                    <div className="space-y-3">
                      {campaign.topLinks.map((link, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#4B5B32] text-[#FAFAF8] flex items-center justify-center text-xs flex-shrink-0">
                              #{i + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm">{link.label}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {link.url}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="flex-shrink-0 ml-2">
                            {link.clicks} clicks
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No link click data available.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Delivery issues */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Delivery Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <AlertTriangle
                          className={`w-4 h-4 ${
                            campaign.bounced > 0
                              ? "text-amber-500"
                              : "text-[#4B5B32]"
                          }`}
                        />
                        <span className="text-sm">Bounces</span>
                      </div>
                      <span className="text-sm">{campaign.bounced}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <AlertTriangle
                          className={`w-4 h-4 ${
                            campaign.unsubscribed > 0
                              ? "text-amber-500"
                              : "text-[#4B5B32]"
                          }`}
                        />
                        <span className="text-sm">Unsubscribes</span>
                      </div>
                      <span className="text-sm">{campaign.unsubscribed}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <AlertTriangle
                          className={`w-4 h-4 ${
                            campaign.spamComplaints > 0
                              ? "text-destructive"
                              : "text-[#4B5B32]"
                          }`}
                        />
                        <span className="text-sm">Spam complaints</span>
                      </div>
                      <span className="text-sm">{campaign.spamComplaints}</span>
                    </div>
                  </div>
                  {campaign.bounced === 0 &&
                    campaign.unsubscribed <= 1 &&
                    campaign.spamComplaints === 0 && (
                      <p className="text-xs text-[#4B5B32] mt-4">
                        Delivery health looks good. Low bounce and unsubscribe
                        rates indicate a healthy, engaged list.
                      </p>
                    )}
                </CardContent>
              </Card>
            </div>

            {/* Raw numbers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detailed Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <p className="text-lg text-[#2E1F33]">
                      {campaign.totalRecipients}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total recipients
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <p className="text-lg text-[#2E1F33]">{campaign.opened}</p>
                    <p className="text-xs text-muted-foreground">
                      Total opens (inc. re-opens)
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <p className="text-lg text-[#2E1F33]">{campaign.clicked}</p>
                    <p className="text-xs text-muted-foreground">
                      Total clicks (inc. re-clicks)
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <p className="text-lg text-[#2E1F33]">
                      {(campaign.opened / Math.max(campaign.uniqueOpens, 1)).toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Opens per reader
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
