"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminLayout } from "../../components/admin-layout";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { ArrowLeft } from "lucide-react";
import type { AdminNewsletterCampaignDetailDto } from "@/lib/api/types";

export function AdminCampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<AdminNewsletterCampaignDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch(`/api/admin/newsletter/${encodeURIComponent(id)}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          if (active) setCampaign(null);
          return;
        }
        const payload = (await response.json()) as AdminNewsletterCampaignDetailDto;
        if (active) setCampaign(payload);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <AdminLayout title="Campaign Detail - Admin">
      <div className="space-y-6">
        <Link
          href="/admin/newsletter"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Newsletter
        </Link>

        {loading ? <p className="text-muted-foreground text-sm">Loading...</p> : null}
        {!loading && !campaign ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-brand-dark text-sm">Campaign not found.</p>
              <Link href="/admin/newsletter">
                <Button variant="outline" className="mt-4">
                  Return to newsletter analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {campaign ? (
          <>
            <div>
              <h1 className="text-brand-dark text-2xl">{campaign.subject}</h1>
              <p className="text-muted-foreground text-sm">
                {new Date(campaign.sentDate).toLocaleString("en-GB")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Metric label="Recipients" value={campaign.totalRecipients} />
              <Metric label="Open rate" value={`${campaign.openRate}%`} />
              <Metric label="Click rate" value={`${campaign.clickRate}%`} />
              <Metric label="CTOR" value={`${campaign.clickToOpenRate}%`} />
            </div>
            <Card>
              <CardContent className="space-y-2 pt-6">
                <h2 className="text-brand-dark text-lg">Top Links</h2>
                {campaign.topLinks.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No click links recorded.</p>
                ) : (
                  campaign.topLinks.map((link) => (
                    <div
                      key={link.url}
                      className="flex items-center justify-between rounded border p-2"
                    >
                      <p className="truncate text-sm">{link.url}</p>
                      <span className="text-muted-foreground text-xs">{link.clicks} clicks</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <p className="text-brand-dark text-2xl">{value}</p>
        <p className="text-muted-foreground text-xs">{label}</p>
      </CardContent>
    </Card>
  );
}
