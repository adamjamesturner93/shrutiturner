"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Compass,
  ListTodo,
  MailWarning,
  MessageCircle,
  Shield,
  TrendingUp,
} from "lucide-react";
import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import type { AdminDashboardSummaryDto, AdminEmailDeliveryHealthDto } from "@/lib/api/types";
import { AppMetricCard, AppMetricGrid, AppPageHeader } from "@/components/app-surface";

export function AdminDashboard({ initialData }: { initialData?: AdminDashboardSummaryDto | null }) {
  const [emailHealth, setEmailHealth] = useState<AdminEmailDeliveryHealthDto | null>(null);
  const [emailActionId, setEmailActionId] = useState<string | null>(null);
  const [emailActionMessage, setEmailActionMessage] = useState<string | null>(null);

  const refreshEmailHealth = useCallback(async () => {
    const res = await fetch("/api/admin/email-deliveries", { cache: "no-store" });
    if (!res.ok) return;
    const payload = (await res.json()) as {
      success?: boolean;
      data?: AdminEmailDeliveryHealthDto;
    };
    if (payload.success && payload.data) setEmailHealth(payload.data);
  }, []);

  useEffect(() => {
    void refreshEmailHealth().catch(() => setEmailHealth(null));
  }, [refreshEmailHealth]);

  async function runEmailAction(deliveryId: string, action: "retry" | "resolve") {
    setEmailActionId(deliveryId);
    setEmailActionMessage(null);
    try {
      const response = await fetch(`/api/admin/email-deliveries/${deliveryId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:
          action === "resolve"
            ? JSON.stringify({ note: "Dismissed from admin dashboard." })
            : undefined,
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      if (!response.ok) {
        setEmailActionMessage(
          payload?.error?.message || "The email delivery could not be updated."
        );
      } else {
        setEmailActionMessage(
          action === "retry" ? "Email retry requested." : "Email issue dismissed."
        );
      }
      await refreshEmailHealth();
    } finally {
      setEmailActionId(null);
    }
  }

  const failedEmailCount = emailHealth ? emailHealth.failedCount + emailHealth.deadLetterCount : 0;

  return (
    <AdminLayout title="Dashboard - Admin">
      <div className="space-y-6">
        <AppPageHeader
          eyebrow="Admin overview"
          title="Instructor Dashboard"
          description="Coaching applications, retreats, clients, newsletter and business operations."
        />

        <AppMetricGrid>
          <AppMetricCard
            label="Coaching TODOs"
            value={initialData?.coachingTodos.length || "Clear"}
            detail={initialData?.coachingTodos.length ? "actions need attention" : "nothing due"}
          />
          <AppMetricCard label="Retreats" value="Enabled" detail="dates, rooms and balances" />
          <AppMetricCard label="Newsletter" value="Live" detail="subscribers and campaigns" />
          <AppMetricCard
            label="Email delivery"
            value={failedEmailCount > 0 ? failedEmailCount : "Clear"}
            detail={failedEmailCount > 0 ? "needs attention" : "no failures reported"}
          />
        </AppMetricGrid>

        {initialData?.coachingTodos.length ? (
          <Card className="border-amber-200 bg-amber-50/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListTodo className="h-4 w-4 text-amber-800" />
                Coaching TODOs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {initialData.coachingTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-white/80 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-3">
                    {todo.priority === "overdue" ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
                    ) : (
                      <ListTodo className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
                    )}
                    <div>
                      <p className="font-medium">{todo.title}</p>
                      <p className="text-muted-foreground mt-1 text-sm">{todo.detail}</p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={todo.href}>
                      Open client
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {emailHealth && failedEmailCount > 0 ? (
          <Card className="border-red-200 bg-red-50/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MailWarning className="h-4 w-4 text-red-700" />
                Email Delivery Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailActionMessage ? (
                <p className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-900">
                  {emailActionMessage}
                </p>
              ) : null}
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
                      <th className="py-2 pl-3">Actions</th>
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
                        <td className="max-w-md py-2 align-top">
                          <details>
                            <summary className="cursor-pointer font-medium">View error</summary>
                            <p className="mt-2 text-xs leading-relaxed break-words">
                              {delivery.lastError || "Unknown error"}
                            </p>
                          </details>
                        </td>
                        <td className="py-2 pl-3 align-top">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={emailActionId === delivery.id}
                              onClick={() => void runEmailAction(delivery.id, "retry")}
                            >
                              Retry
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={emailActionId === delivery.id}
                              onClick={() => void runEmailAction(delivery.id, "resolve")}
                            >
                              Dismiss
                            </Button>
                          </div>
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
              href: "/admin/retreats",
              title: "Retreats",
              body: "Manage retreat dates, room capacity, bookings, deposits and balance emails.",
              icon: CalendarDays,
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
              Live online classes, small groups, class credits and Move Well membership remain
              hidden. Retreats are enabled for public discovery, client bookings and admin testing.
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
