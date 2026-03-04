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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Campaign not found.</p>
          <Link href="/admin/newsletter">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Newsletter
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
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Newsletter
        </button>

        {/* Header */}
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl text-[#2E1F33]">{campaign.subject}</h1>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="capitalize">
              {campaign.type === "newsletter" ? (
                <Mail className="mr-1 h-3 w-3" />
              ) : (
                <BookOpen className="mr-1 h-3 w-3" />
              )}
              {campaign.type.replace("-", " ")}
            </Badge>
            <Badge variant={isScheduled ? "secondary" : "default"}>
              {isScheduled ? "Scheduled" : "Sent"}
            </Badge>
            <span className="text-muted-foreground text-sm">
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
              <Send className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
              <p className="text-lg text-[#2E1F33]">Campaign scheduled</p>
              <p className="text-muted-foreground mt-1 text-sm">
                This campaign will be sent to {campaign.totalRecipients} recipients on{" "}
                {new Date(campaign.sentDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                })}
                .
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Analytics will be available after sending.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Delivery stats */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Send className="mx-auto h-5 w-5 text-[#4B5B32]" />
                  <p className="mt-2 text-2xl text-[#2E1F33]">{campaign.delivered}</p>
                  <p className="text-muted-foreground text-xs">
                    Delivered (of {campaign.totalRecipients})
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Eye className="mx-auto h-5 w-5 text-[#4B5B32]" />
                  <p className="mt-2 text-2xl text-[#2E1F33]">{campaign.uniqueOpens}</p>
                  <p className="text-muted-foreground text-xs">
                    Unique opens ({campaign.openRate}%)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <MousePointerClick className="mx-auto h-5 w-5 text-[#4B5B32]" />
                  <p className="mt-2 text-2xl text-[#2E1F33]">{campaign.uniqueClicks}</p>
                  <p className="text-muted-foreground text-xs">
                    Unique clicks ({campaign.clickRate}%)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="mx-auto h-5 w-5 text-[#4B5B32]" />
                  <p className="mt-2 text-2xl text-[#2E1F33]">{campaign.clickToOpenRate}%</p>
                  <p className="text-muted-foreground text-xs">Click-to-open rate</p>
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
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{step.label}</span>
                        <span className="text-muted-foreground">
                          {step.value} ({((step.value / step.total) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="bg-secondary h-6 overflow-hidden rounded-md">
                        <div
                          className={`h-full ${step.color} flex items-center rounded-md px-2 transition-all`}
                          style={{
                            width: `${Math.max((step.value / campaign.totalRecipients) * 100, 2)}%`,
                          }}
                        >
                          <span className="text-xs text-white">{step.value}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top links + issues side by side */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                          className="bg-secondary/50 flex items-center justify-between rounded-lg p-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#4B5B32] text-xs text-[#FAFAF8]">
                              #{i + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm">{link.label}</p>
                              <p className="text-muted-foreground truncate text-xs">{link.url}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-2 flex-shrink-0">
                            {link.clicks} clicks
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No link click data available.</p>
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
                    <div className="bg-secondary/50 flex items-center justify-between rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <AlertTriangle
                          className={`h-4 w-4 ${
                            campaign.bounced > 0 ? "text-amber-500" : "text-[#4B5B32]"
                          }`}
                        />
                        <span className="text-sm">Bounces</span>
                      </div>
                      <span className="text-sm">{campaign.bounced}</span>
                    </div>
                    <div className="bg-secondary/50 flex items-center justify-between rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <AlertTriangle
                          className={`h-4 w-4 ${
                            campaign.unsubscribed > 0 ? "text-amber-500" : "text-[#4B5B32]"
                          }`}
                        />
                        <span className="text-sm">Unsubscribes</span>
                      </div>
                      <span className="text-sm">{campaign.unsubscribed}</span>
                    </div>
                    <div className="bg-secondary/50 flex items-center justify-between rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <AlertTriangle
                          className={`h-4 w-4 ${
                            campaign.spamComplaints > 0 ? "text-destructive" : "text-[#4B5B32]"
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
                      <p className="mt-4 text-xs text-[#4B5B32]">
                        Delivery health looks good. Low bounce and unsubscribe rates indicate a
                        healthy, engaged list.
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
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <p className="text-lg text-[#2E1F33]">{campaign.totalRecipients}</p>
                    <p className="text-muted-foreground text-xs">Total recipients</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <p className="text-lg text-[#2E1F33]">{campaign.opened}</p>
                    <p className="text-muted-foreground text-xs">Total opens (inc. re-opens)</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <p className="text-lg text-[#2E1F33]">{campaign.clicked}</p>
                    <p className="text-muted-foreground text-xs">Total clicks (inc. re-clicks)</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <p className="text-lg text-[#2E1F33]">
                      {(campaign.opened / Math.max(campaign.uniqueOpens, 1)).toFixed(1)}
                    </p>
                    <p className="text-muted-foreground text-xs">Opens per reader</p>
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
