"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent } from "../../components/ui/card";
import { Users, PoundSterling, TrendingUp, UserPlus } from "lucide-react";

type AdminBusinessSummary = {
  activeMembers: number;
  totalMembers: number;
  monthlyRecurringRevenuePence: number;
  newMembersThisMonth: number;
  cancelledLast30Days: number;
  churnRatePercent: number;
};

export function AdminBusiness() {
  const [summary, setSummary] = useState<AdminBusinessSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/admin/business", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as AdminBusinessSummary;
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
    <AdminLayout title="Business Overview - Shruti Turner">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl text-[#2E1F33]">Business Overview</h1>
          <p className="text-muted-foreground mt-1">Live metrics from your database.</p>
        </div>

        {loading ? <p className="text-muted-foreground text-sm">Loading...</p> : null}
        {!loading && !summary ? (
          <p className="text-muted-foreground text-sm">No business metrics available.</p>
        ) : null}

        {summary ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Active Members</p>
                    <p className="mt-1 text-3xl text-[#2E1F33]">{summary.activeMembers}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      of {summary.totalMembers} total
                    </p>
                  </div>
                  <Users className="h-6 w-6 text-[#4B5B32]" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Monthly Recurring</p>
                    <p className="mt-1 text-3xl text-[#2E1F33]">
                      £{Math.round(summary.monthlyRecurringRevenuePence / 100)}
                    </p>
                  </div>
                  <PoundSterling className="h-6 w-6 text-[#4B5B32]" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">New Members (Month)</p>
                    <p className="mt-1 text-3xl text-[#2E1F33]">{summary.newMembersThisMonth}</p>
                  </div>
                  <UserPlus className="h-6 w-6 text-[#4B5B32]" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Churn (30d)</p>
                    <p className="mt-1 text-3xl text-[#2E1F33]">{summary.churnRatePercent}%</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {summary.cancelledLast30Days} cancelled/expired
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-[#4B5B32]" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
