"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent } from "../../components/ui/card";
import { Users, Bell, BookOpen, AlertTriangle } from "lucide-react";

type CampaignSummary = {
  id: string;
  subject: string;
  status: "sent" | "scheduled";
  sentDate: string;
  totalRecipients: number;
};

type NewsletterSummary = {
  totalSubscribers: number;
  newsletterSubscribers: number;
  blogSubscribers: number;
  unsubscribes30d: number;
  campaigns: CampaignSummary[];
};

export function AdminNewsletter() {
  const [summary, setSummary] = useState<NewsletterSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/admin/newsletter", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as NewsletterSummary;
        if (active) setSummary(payload);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AdminLayout title="Newsletter Analytics - Admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl text-[#2E1F33]">Newsletter Analytics</h1>
          <p className="text-muted-foreground mt-1">Subscriber stats from the live database.</p>
        </div>

        {loading ? <p className="text-muted-foreground text-sm">Loading...</p> : null}
        {!loading && !summary ? (
          <p className="text-muted-foreground text-sm">No newsletter analytics available.</p>
        ) : null}

        {summary ? (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-[#4B5B32]" />
                    <div>
                      <p className="text-2xl text-[#2E1F33]">{summary.totalSubscribers}</p>
                      <p className="text-muted-foreground text-xs">Total subscribers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-[#4B5B32]" />
                    <div>
                      <p className="text-2xl text-[#2E1F33]">{summary.newsletterSubscribers}</p>
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
                      <p className="text-2xl text-[#2E1F33]">{summary.blogSubscribers}</p>
                      <p className="text-muted-foreground text-xs">Blog subscribers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-2xl text-[#2E1F33]">{summary.unsubscribes30d}</p>
                      <p className="text-muted-foreground text-xs">Unsubscribes (30d)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-sm text-[#2E1F33]">Campaign performance is not yet stored in the database.</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Wire Postmark webhooks/events to persist campaign telemetry for detailed analytics.
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
