"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminLayout } from "../../components/admin-layout";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { ArrowLeft } from "lucide-react";

type CampaignSummary = {
  id: string;
  subject: string;
  status: "sent" | "scheduled";
  sentDate: string;
  totalRecipients: number;
};

export function AdminCampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<CampaignSummary | null>(null);
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
        const payload = (await response.json()) as CampaignSummary;
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
        <Link href="/admin/newsletter" className="text-muted-foreground inline-flex items-center gap-2 text-sm hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Newsletter
        </Link>
        {loading ? <p className="text-muted-foreground text-sm">Loading...</p> : null}
        {!loading && !campaign ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-[#2E1F33]">Campaign details are not available yet.</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Connect campaign telemetry storage to view per-campaign analytics.
              </p>
              <Link href="/admin/newsletter">
                <Button variant="outline" className="mt-4">
                  Return to newsletter analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AdminLayout>
  );
}
