"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, MailWarning, MessageCircle, Shield, TrendingUp } from "lucide-react";
import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import type { AdminDashboardSummaryDto, AdminEmailDeliveryHealthDto } from "@/lib/api/types";
import { AppMetricCard, AppMetricGrid, AppPageHeader } from "@/components/app-surface";

export function AdminDashboard({
  initialData: _initialData,
}: {
  initialData?: AdminDashboardSummaryDto | null;
}) {
  void _initialData;
  const [emailHealth, setEmailHealth] = useState<AdminEmailDeliveryHealthDto | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/admin/email-deliveries", { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as {
          success?: boolean;
          data?: AdminEmailDeliveryHealthDto;
        };
        if (active && payload.success && payload.data) {
          setEmailHealth(payload.data);
        }
      } catch {
        if (active) setEmailHealth(null);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const failedEmailCount = emailHealth ? emailHealth.failedCount + emailHealth.deadLetterCount : 0;

  return (
    <AdminLayout title="Dashboard - Admin">
      <div className="space-y-6">
        <AppPageHeader
          eyebrow="Admin overview"
          title="Instructor Dashboard"
          description="Coaching applications, clients, newsletter and business operations."
        />

        <AppMetricGrid>
          <AppMetricCard label="Coaching" value="Active" detail="applications and clients" />
          <AppMetricCard label="Newsletter" value="Live" detail="subscribers and campaigns" />
          <AppMetricCard
            label="Email delivery"
            value={failedEmailCount > 0 ? failedEmailCount : "Clear"}
            detail={failedEmailCount > 0 ? "needs attention" : "no failures reported"}
          />
        </AppMetricGrid>

        {emailHealth && failedEmailCount > 0 ? (
          <Card className="border-red-200 bg-red-50/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MailWarning className="h-4 w-4 text-red-700" />
                Email Delivery Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Metric label="Failed" value={emailHealth.failedCount} />
                <Metric label="Dead letter" value={emailHealth.deadLetterCount} />
                <Metric label="Retry due" value={emailHealth.retryQueuedCount} />
              </div>
              {emailHealth.nextRetryAt ? (
                <p className="text-sm text-red-800">
                  Next retry: {new Date(emailHealth.nextRetryAt).toLocaleString("en-GB")}
                </p>
              ) : null}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-red-900/70">
                    <tr>
                      <th className="py-2 pr-3">Template</th>
                      <th className="py-2 pr-3">Recipient</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Attempts</th>
                      <th className="py-2">Last error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailHealth.recentFailures.map((delivery) => (
                      <tr key={delivery.id} className="border-b border-red-100">
                        <td className="py-2 pr-3">{delivery.templateKey}</td>
                        <td className="py-2 pr-3">{delivery.toEmail}</td>
                        <td className="py-2 pr-3">
                          <Badge
                            variant={delivery.status === "dead_letter" ? "destructive" : "outline"}
                          >
                            {delivery.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-2 pr-3">
                          {delivery.attemptCount}/{delivery.maxAttempts}
                        </td>
                        <td className="max-w-md truncate py-2">
                          {delivery.lastError || "Unknown"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              href: "/admin/coaching",
              title: "Coaching",
              body: "Review applications, waiting list, onboarding, active clients and package changes.",
              icon: Compass,
            },
            {
              href: "/admin/newsletter",
              title: "Newsletter",
              body: "Review subscribers, Contentful-triggered campaigns and delivery status.",
              icon: MailWarning,
            },
            {
              href: "/admin/blog-comments",
              title: "Blog Comments",
              body: "Moderate reader comments and keep public discussion tidy.",
              icon: MessageCircle,
            },
            {
              href: "/admin/business",
              title: "Business",
              body: "Manage billing operations, refunds, compliance events and reporting.",
              icon: TrendingUp,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.href}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="text-primary h-5 w-5" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.body}</p>
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link href={item.href}>
                      Open
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="text-primary h-5 w-5" />
              Hidden for now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Live online classes, retreats, small groups, class credits and Move Well membership
              are intentionally hidden from public, user and admin navigation while coaching is the
              active offer.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-white/70 p-3">
      <p className="text-xs text-red-900/70">{label}</p>
      <p className="mt-1 text-xl font-semibold text-red-950">{value}</p>
    </div>
  );
}
