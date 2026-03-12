"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { PoundSterling, TrendingUp, UserPlus, Users } from "lucide-react";
import type { AdminBusinessMetricDto } from "@/lib/api/types";

export function AdminBusiness() {
  const [summary, setSummary] = useState<AdminBusinessMetricDto | null>(null);
  const [activeTab, setActiveTab] = useState<"health" | "pricing" | "discounts">("health");
  const [catalog, setCatalog] = useState<
    Array<{ key: string; stripePriceId: string; unitAmountPence: number; currency: string }>
  >([]);
  const [discounts, setDiscounts] = useState<Array<{ stripePromotionCodeId: string; code: string; active: boolean; type: string }>>([]);
  const [newPriceKey, setNewPriceKey] = useState("membership_movewell_monthly");
  const [newPriceAmount, setNewPriceAmount] = useState("2900");
  const [newCode, setNewCode] = useState("");
  const [newCodeType, setNewCodeType] = useState<"percent" | "amount">("percent");
  const [newCodeValue, setNewCodeValue] = useState("10");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [response, catalogResponse, discountResponse] = await Promise.all([
          fetch("/api/admin/business", { cache: "no-store" }),
          fetch("/api/admin/business/catalog", { cache: "no-store" }),
          fetch("/api/admin/business/discounts", { cache: "no-store" }),
        ]);
        if (response.ok && active) {
          const payload = (await response.json()) as AdminBusinessMetricDto;
          setSummary(payload);
        }
        if (catalogResponse.ok && active) {
          setCatalog(
            ((await catalogResponse.json()) as Array<{
              key: string;
              stripePriceId: string;
              unitAmountPence: number;
              currency: string;
            }>) || []
          );
        }
        if (discountResponse.ok && active) {
          setDiscounts(
            ((await discountResponse.json()) as Array<{
              stripePromotionCodeId: string;
              code: string;
              active: boolean;
              type: string;
            }>) || []
          );
        }
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
          <p className="text-muted-foreground mt-1">Stripe + membership analytics from local projections.</p>
          {summary?.dataFreshnessIso ? (
            <p className="text-muted-foreground mt-1 text-xs">
              Data freshness: {new Date(summary.dataFreshnessIso).toLocaleString("en-GB")}
            </p>
          ) : null}
        </div>

        {loading ? <p className="text-muted-foreground text-sm">Loading...</p> : null}
        {!loading && !summary ? (
          <p className="text-muted-foreground text-sm">No business metrics available.</p>
        ) : null}

        {summary ? (
          <>
            <div className="flex flex-wrap gap-2">
              <Button variant={activeTab === "health" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("health")}>
                Health
              </Button>
              <Button variant={activeTab === "pricing" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("pricing")}>
                Pricing
              </Button>
              <Button variant={activeTab === "discounts" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("discounts")}>
                Discount Codes
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard title="Active Members" value={summary.activeMembers} sub={`of ${summary.totalMembers} total`} icon={<Users className="h-6 w-6 text-[#4B5B32]" />} />
              <MetricCard title="MRR" value={`£${Math.round(summary.monthlyRecurringRevenuePence / 100)}`} icon={<PoundSterling className="h-6 w-6 text-[#4B5B32]" />} />
              <MetricCard title="New Members (MTD)" value={summary.newMembersThisMonth} icon={<UserPlus className="h-6 w-6 text-[#4B5B32]" />} />
              <MetricCard title="Churn (30d)" value={`${summary.churnRatePercent}%`} sub={`${summary.cancelledLast30Days} cancelled/expired`} icon={<TrendingUp className="h-6 w-6 text-[#4B5B32]" />} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <MetricCard title="Failed Payments (7d)" value={summary.failedPayments7d} />
              <MetricCard title="Failed Payments (30d)" value={summary.failedPayments30d} />
            </div>

            {activeTab === "pricing" ? (
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <h2 className="text-lg text-[#2E1F33]">Pricing Catalog</h2>
                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <select
                      value={newPriceKey}
                      onChange={(e) => setNewPriceKey(e.target.value)}
                      className="border-border bg-background rounded-md border px-3 py-2 text-sm"
                    >
                      <option value="membership_movewell_monthly">Membership Move Well (Monthly)</option>
                      <option value="membership_movewell_annual">Membership Move Well (Annual)</option>
                      <option value="credits_1">Credits 1</option>
                      <option value="credits_3">Credits 3</option>
                      <option value="credits_10">Credits 10</option>
                    </select>
                    <Input value={newPriceAmount} onChange={(e) => setNewPriceAmount(e.target.value)} placeholder="Amount in pence" />
                    <Button
                      onClick={async () => {
                        const res = await fetch("/api/admin/business/catalog/price", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            key: newPriceKey,
                            unitAmountPence: Number(newPriceAmount || 0),
                          }),
                        });
                        if (!res.ok) return;
                        const refreshed = await fetch("/api/admin/business/catalog", { cache: "no-store" });
                        if (refreshed.ok) setCatalog(await refreshed.json());
                      }}
                    >
                      Create price
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {catalog.map((row) => (
                      <div key={row.key} className="flex items-center justify-between rounded border p-2 text-sm">
                        <span>{row.key}</span>
                        <span>
                          {(row.currency || "GBP").toUpperCase()} {(row.unitAmountPence / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {activeTab === "discounts" ? (
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <h2 className="text-lg text-[#2E1F33]">Discount Codes</h2>
                  <div className="grid gap-2 sm:grid-cols-[1fr_120px_120px_auto]">
                    <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="Code" />
                    <select
                      value={newCodeType}
                      onChange={(e) => setNewCodeType(e.target.value as "percent" | "amount")}
                      className="border-border bg-background rounded-md border px-3 py-2 text-sm"
                    >
                      <option value="percent">Percent</option>
                      <option value="amount">Amount</option>
                    </select>
                    <Input value={newCodeValue} onChange={(e) => setNewCodeValue(e.target.value)} placeholder={newCodeType === "percent" ? "10" : "1000"} />
                    <Button
                      onClick={async () => {
                        const payload =
                          newCodeType === "percent"
                            ? { code: newCode, type: "percent", percentOff: Number(newCodeValue || 0) }
                            : { code: newCode, type: "amount", amountOffPence: Number(newCodeValue || 0) };
                        const res = await fetch("/api/admin/business/discounts", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(payload),
                        });
                        if (!res.ok) return;
                        const refreshed = await fetch("/api/admin/business/discounts", { cache: "no-store" });
                        if (refreshed.ok) setDiscounts(await refreshed.json());
                      }}
                    >
                      Create code
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {discounts.map((row) => (
                      <div key={row.stripePromotionCodeId} className="flex items-center justify-between rounded border p-2 text-sm">
                        <span>{row.code}</span>
                        <Button
                          size="sm"
                          variant={row.active ? "outline" : "default"}
                          onClick={async () => {
                            const res = await fetch(`/api/admin/business/discounts/${encodeURIComponent(row.stripePromotionCodeId)}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ active: !row.active }),
                            });
                            if (!res.ok) return;
                            const refreshed = await fetch("/api/admin/business/discounts", { cache: "no-store" });
                            if (refreshed.ok) setDiscounts(await refreshed.json());
                          }}
                        >
                          {row.active ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}

function MetricCard({
  title,
  value,
  sub,
  icon,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className="mt-1 text-3xl text-[#2E1F33]">{value}</p>
            {sub ? <p className="text-muted-foreground mt-1 text-xs">{sub}</p> : null}
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
