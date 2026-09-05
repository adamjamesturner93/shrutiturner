"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminLayout } from "../../components/admin-layout";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { AlertTriangle, ArrowLeft, Info } from "lucide-react";
import type { AdminNewsletterCampaignDetailDto } from "@/lib/api/types";
import { InlineLoadingStatus } from "@/components/loading-region";

function formatRate(
  rate: number | null,
  trackingState: AdminNewsletterCampaignDetailDto["trackingState"]
) {
  if (rate !== null) return `${rate}%`;
  return trackingState === "awaiting" ? "Pending" : "Unavailable";
}

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

        {loading ? <InlineLoadingStatus label="Loading campaign…" /> : null}
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
                {new Date(campaign.sentDate).toLocaleString("en-GB")} · {campaign.status} ·{" "}
                {campaign.sourceSystem}
              </p>
            </div>
            {campaign.attentionReasons.length > 0 ? (
              <Card className="border-red-300 bg-red-50/60">
                <CardContent className="space-y-2 pt-6">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                    <h2 className="font-semibold">Why this campaign needs attention</h2>
                  </div>
                  <ul className="list-disc space-y-1 pl-6 text-sm text-red-900">
                    {campaign.attentionReasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                  {campaign.errorSummary ? (
                    <details className="text-sm text-red-900">
                      <summary className="cursor-pointer font-medium">Technical details</summary>
                      <p className="mt-2 break-words whitespace-pre-wrap">
                        {campaign.errorSummary}
                      </p>
                    </details>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
            <Card>
              <CardContent className="flex gap-3 pt-6 text-sm">
                <Info className="text-brand-olive mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-brand-dark font-medium">Reporting scope</p>
                  <p className="text-muted-foreground">
                    {campaign.reportingSource === "postmark_api"
                      ? "Delivery, open, click and bounce totals are queried directly from Postmark."
                      : "This older campaign uses stored event history because it predates campaign-specific Postmark reporting."}{" "}
                    These results cover this campaign only
                    {campaign.messageStream ? ` in the ${campaign.messageStream} stream` : ""}.
                    Unsubscribes and the event timeline remain sourced from this application's
                    records.
                  </p>
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Metric label="Recipients" value={campaign.totalRecipients} />
              <Metric label="Delivery rate" value={`${campaign.deliveryRate}%`} />
              <Metric
                label="Open rate"
                value={formatRate(campaign.openRate, campaign.trackingState)}
              />
              <Metric
                label="Click rate"
                value={formatRate(campaign.clickRate, campaign.trackingState)}
              />
              <Metric
                label="CTOR"
                value={formatRate(campaign.clickToOpenRate, campaign.trackingState)}
              />
              <Metric label="Bounce rate" value={`${campaign.bounceRate}%`} />
              <Metric label="Unsubscribe rate" value={`${campaign.unsubscribeRate}%`} />
              <Metric label="Spam complaints" value={campaign.spamComplaints} />
            </div>
            <Card>
              <CardContent className="space-y-3 pt-6">
                <h2 className="text-brand-dark text-lg">Delivery outcomes</h2>
                <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                  <Outcome label="Delivered" value={campaign.delivered} />
                  <Outcome label="Bounced" value={campaign.bounced} />
                  <Outcome label="Unsubscribed" value={campaign.unsubscribed} />
                  <Outcome label="Failed sends" value={campaign.failedSends} />
                </div>
              </CardContent>
            </Card>
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
            <Card>
              <CardContent className="space-y-2 pt-6">
                <h2 className="text-brand-dark text-lg">Event timeline</h2>
                {campaign.eventTimeline.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No dated events recorded.</p>
                ) : (
                  campaign.eventTimeline.map((event) => (
                    <div
                      key={event.date}
                      className="grid grid-cols-4 gap-3 rounded border p-2 text-sm"
                    >
                      <span>{event.date}</span>
                      <span>Open {event.opened}</span>
                      <span>Click {event.clicked}</span>
                      <span>Bounce {event.bounced}</span>
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

function Outcome({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border p-3">
      <p className="text-brand-dark text-lg">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
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
