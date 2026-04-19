"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import type {
  AdminBusinessMetricDto,
  ClassOperationalSettingsDto,
  PlatformSettingsDto,
} from "@/lib/api/types";
import { AppMetricCard, AppMetricGrid, AppPageHeader } from "@/components/app-surface";
import { getApiErrorMessage, isApiSuccess } from "@/lib/api/client";

export function AdminBusiness() {
  const [summary, setSummary] = useState<AdminBusinessMetricDto | null>(null);
  const [activeTab, setActiveTab] = useState<
    "health" | "settings" | "pricing" | "discounts" | "class-rules"
  >("health");
  const [catalog, setCatalog] = useState<
    Array<{ key: string; stripePriceId: string; unitAmountPence: number; currency: string }>
  >([]);
  const [discounts, setDiscounts] = useState<
    Array<{ stripePromotionCodeId: string; code: string; active: boolean; type: string }>
  >([]);
  const [newPriceKey, setNewPriceKey] = useState("membership_movewell_monthly");
  const [newPriceAmount, setNewPriceAmount] = useState("2900");
  const [newCode, setNewCode] = useState("");
  const [newCodeType, setNewCodeType] = useState<"percent" | "amount">("percent");
  const [newCodeValue, setNewCodeValue] = useState("10");
  const [classRules, setClassRules] = useState<ClassOperationalSettingsDto | null>(null);
  const [settings, setSettings] = useState<PlatformSettingsDto | null>(null);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingClassRules, setSavingClassRules] = useState(false);
  const [classRulesMessage, setClassRulesMessage] = useState("");
  const [classRulesError, setClassRulesError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [response, catalogResponse, discountResponse, classRulesResponse, settingsResponse] =
          await Promise.all([
            fetch("/api/admin/business", { cache: "no-store" }),
            fetch("/api/admin/business/catalog", { cache: "no-store" }),
            fetch("/api/admin/business/discounts", { cache: "no-store" }),
            fetch("/api/admin/business/class-rules", { cache: "no-store" }),
            fetch("/api/admin/business/settings", { cache: "no-store" }),
          ]);
        if (response.ok && active) {
          const payload = (await response.json().catch(() => null)) as unknown;
          if (isApiSuccess<AdminBusinessMetricDto>(payload)) {
            setSummary(payload.data);
          }
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
        if (classRulesResponse.ok && active) {
          const payload = (await classRulesResponse.json().catch(() => null)) as unknown;
          if (isApiSuccess<ClassOperationalSettingsDto>(payload)) {
            setClassRules(payload.data);
          }
        }
        if (settingsResponse.ok && active) {
          const payload = (await settingsResponse.json().catch(() => null)) as unknown;
          if (isApiSuccess<PlatformSettingsDto>(payload)) {
            setSettings(payload.data);
          }
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
        <AppPageHeader
          eyebrow="Business operations"
          title="Business Overview"
          description="Stripe + membership analytics from local projections."
          meta={
            summary?.dataFreshnessIso
              ? `Data freshness: ${new Date(summary.dataFreshnessIso).toLocaleString("en-GB")}`
              : undefined
          }
        />

        {loading ? <p className="text-muted-foreground text-sm">Loading...</p> : null}
        {!loading && !summary ? (
          <p className="text-muted-foreground text-sm">No business metrics available.</p>
        ) : null}

        {summary ? (
          <>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeTab === "health" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("health")}
              >
                Health
              </Button>
              <Button
                variant={activeTab === "settings" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("settings")}
              >
                Settings
              </Button>
              <Button
                variant={activeTab === "pricing" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("pricing")}
              >
                Pricing
              </Button>
              <Button
                variant={activeTab === "discounts" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("discounts")}
              >
                Discount Codes
              </Button>
              <Button
                variant={activeTab === "class-rules" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("class-rules")}
              >
                Class Rules
              </Button>
            </div>

            <AppMetricGrid>
              <AppMetricCard
                label="Active members"
                value={summary.activeMembers}
                detail={`of ${summary.totalMembers} total`}
              />
              <AppMetricCard
                label="MRR"
                value={`£${Math.round(summary.monthlyRecurringRevenuePence / 100)}`}
                detail="monthly recurring revenue"
              />
              <AppMetricCard
                label="New members (MTD)"
                value={summary.newMembersThisMonth}
                detail="joined this month"
              />
              <AppMetricCard
                label="Churn (30d)"
                value={`${summary.churnRatePercent}%`}
                detail={`${summary.cancelledLast30Days} cancelled/expired`}
              />
            </AppMetricGrid>
            <AppMetricGrid className="lg:grid-cols-2">
              <AppMetricCard label="Failed payments (7d)" value={summary.failedPayments7d} />
              <AppMetricCard label="Failed payments (30d)" value={summary.failedPayments30d} />
            </AppMetricGrid>

            {activeTab === "settings" ? (
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <h2 className="text-brand-dark text-lg">Platform Settings</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Business details, default SEO metadata, and analytics identifiers.
                    </p>
                  </div>

                  {settingsError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {settingsError}
                    </div>
                  ) : null}
                  {settingsMessage ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {settingsMessage}
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm">Business name</span>
                      <Input
                        value={settings?.businessName || ""}
                        onChange={(event) =>
                          setSettings((current) => ({
                            businessName: event.target.value,
                            supportEmail: current?.supportEmail || null,
                            contactEmail: current?.contactEmail || null,
                            instagramUrl: current?.instagramUrl || null,
                            defaultSeoTitle: current?.defaultSeoTitle || null,
                            defaultSeoDescription: current?.defaultSeoDescription || null,
                            gaMeasurementId: current?.gaMeasurementId || null,
                          }))
                        }
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm">Support email</span>
                      <Input
                        value={settings?.supportEmail || ""}
                        onChange={(event) =>
                          setSettings((current) => ({
                            businessName: current?.businessName || "Shruti Turner",
                            supportEmail: event.target.value || null,
                            contactEmail: current?.contactEmail || null,
                            instagramUrl: current?.instagramUrl || null,
                            defaultSeoTitle: current?.defaultSeoTitle || null,
                            defaultSeoDescription: current?.defaultSeoDescription || null,
                            gaMeasurementId: current?.gaMeasurementId || null,
                          }))
                        }
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm">Contact email</span>
                      <Input
                        value={settings?.contactEmail || ""}
                        onChange={(event) =>
                          setSettings((current) => ({
                            businessName: current?.businessName || "Shruti Turner",
                            supportEmail: current?.supportEmail || null,
                            contactEmail: event.target.value || null,
                            instagramUrl: current?.instagramUrl || null,
                            defaultSeoTitle: current?.defaultSeoTitle || null,
                            defaultSeoDescription: current?.defaultSeoDescription || null,
                            gaMeasurementId: current?.gaMeasurementId || null,
                          }))
                        }
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm">Instagram URL</span>
                      <Input
                        value={settings?.instagramUrl || ""}
                        onChange={(event) =>
                          setSettings((current) => ({
                            businessName: current?.businessName || "Shruti Turner",
                            supportEmail: current?.supportEmail || null,
                            contactEmail: current?.contactEmail || null,
                            instagramUrl: event.target.value || null,
                            defaultSeoTitle: current?.defaultSeoTitle || null,
                            defaultSeoDescription: current?.defaultSeoDescription || null,
                            gaMeasurementId: current?.gaMeasurementId || null,
                          }))
                        }
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm">Default SEO title</span>
                      <Input
                        value={settings?.defaultSeoTitle || ""}
                        onChange={(event) =>
                          setSettings((current) => ({
                            businessName: current?.businessName || "Shruti Turner",
                            supportEmail: current?.supportEmail || null,
                            contactEmail: current?.contactEmail || null,
                            instagramUrl: current?.instagramUrl || null,
                            defaultSeoTitle: event.target.value || null,
                            defaultSeoDescription: current?.defaultSeoDescription || null,
                            gaMeasurementId: current?.gaMeasurementId || null,
                          }))
                        }
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm">GA measurement ID</span>
                      <Input
                        value={settings?.gaMeasurementId || ""}
                        onChange={(event) =>
                          setSettings((current) => ({
                            businessName: current?.businessName || "Shruti Turner",
                            supportEmail: current?.supportEmail || null,
                            contactEmail: current?.contactEmail || null,
                            instagramUrl: current?.instagramUrl || null,
                            defaultSeoTitle: current?.defaultSeoTitle || null,
                            defaultSeoDescription: current?.defaultSeoDescription || null,
                            gaMeasurementId: event.target.value || null,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <label className="space-y-2">
                    <span className="text-sm">Default SEO description</span>
                    <Input
                      value={settings?.defaultSeoDescription || ""}
                      onChange={(event) =>
                        setSettings((current) => ({
                          businessName: current?.businessName || "Shruti Turner",
                          supportEmail: current?.supportEmail || null,
                          contactEmail: current?.contactEmail || null,
                          instagramUrl: current?.instagramUrl || null,
                          defaultSeoTitle: current?.defaultSeoTitle || null,
                          defaultSeoDescription: event.target.value || null,
                          gaMeasurementId: current?.gaMeasurementId || null,
                        }))
                      }
                    />
                  </label>

                  <div className="flex justify-end">
                    <Button
                      disabled={!settings || savingSettings}
                      onClick={async () => {
                        if (!settings) return;
                        setSavingSettings(true);
                        setSettingsMessage("");
                        setSettingsError("");
                        try {
                          const response = await fetch("/api/admin/business/settings", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(settings),
                          });
                          const payload = (await response.json().catch(() => null)) as
                            | { success: true; data: PlatformSettingsDto }
                            | { error?: { message?: string } }
                            | null;

                          if (!response.ok || !payload || !("success" in payload)) {
                            throw new Error(
                              payload && "error" in payload
                                ? payload.error?.message || "Unable to save platform settings."
                                : "Unable to save platform settings."
                            );
                          }

                          setSettings(payload.data);
                          setSettingsMessage("Platform settings updated.");
                        } catch (error) {
                          setSettingsError(
                            error instanceof Error
                              ? error.message
                              : "Unable to save platform settings."
                          );
                        } finally {
                          setSavingSettings(false);
                        }
                      }}
                    >
                      {savingSettings ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {activeTab === "pricing" ? (
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <h2 className="text-brand-dark text-lg">Pricing Catalog</h2>
                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <select
                      value={newPriceKey}
                      onChange={(e) => setNewPriceKey(e.target.value)}
                      className="border-border bg-background rounded-md border px-3 py-2 text-sm"
                    >
                      <option value="membership_movewell_monthly">
                        Membership Move Well (Monthly)
                      </option>
                      <option value="membership_movewell_annual">
                        Membership Move Well (Annual)
                      </option>
                      <option value="credits_1">Credits 1</option>
                      <option value="credits_3">Credits 3</option>
                      <option value="credits_10">Credits 10</option>
                    </select>
                    <Input
                      value={newPriceAmount}
                      onChange={(e) => setNewPriceAmount(e.target.value)}
                      placeholder="Amount in pence"
                    />
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
                        const refreshed = await fetch("/api/admin/business/catalog", {
                          cache: "no-store",
                        });
                        if (refreshed.ok) setCatalog(await refreshed.json());
                      }}
                    >
                      Create price
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {catalog.map((row) => (
                      <div
                        key={row.key}
                        className="flex items-center justify-between rounded border p-2 text-sm"
                      >
                        <span>{row.key}</span>
                        <span>
                          {(row.currency || "GBP").toUpperCase()}{" "}
                          {(row.unitAmountPence / 100).toFixed(2)}
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
                  <h2 className="text-brand-dark text-lg">Discount Codes</h2>
                  <div className="grid gap-2 sm:grid-cols-[1fr_120px_120px_auto]">
                    <Input
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder="Code"
                    />
                    <select
                      value={newCodeType}
                      onChange={(e) => setNewCodeType(e.target.value as "percent" | "amount")}
                      className="border-border bg-background rounded-md border px-3 py-2 text-sm"
                    >
                      <option value="percent">Percent</option>
                      <option value="amount">Amount</option>
                    </select>
                    <Input
                      value={newCodeValue}
                      onChange={(e) => setNewCodeValue(e.target.value)}
                      placeholder={newCodeType === "percent" ? "10" : "1000"}
                    />
                    <Button
                      onClick={async () => {
                        const payload =
                          newCodeType === "percent"
                            ? {
                                code: newCode,
                                type: "percent",
                                percentOff: Number(newCodeValue || 0),
                              }
                            : {
                                code: newCode,
                                type: "amount",
                                amountOffPence: Number(newCodeValue || 0),
                              };
                        const res = await fetch("/api/admin/business/discounts", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(payload),
                        });
                        if (!res.ok) return;
                        const refreshed = await fetch("/api/admin/business/discounts", {
                          cache: "no-store",
                        });
                        if (refreshed.ok) setDiscounts(await refreshed.json());
                      }}
                    >
                      Create code
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {discounts.map((row) => (
                      <div
                        key={row.stripePromotionCodeId}
                        className="flex items-center justify-between rounded border p-2 text-sm"
                      >
                        <span>{row.code}</span>
                        <Button
                          size="sm"
                          variant={row.active ? "outline" : "default"}
                          onClick={async () => {
                            const res = await fetch(
                              `/api/admin/business/discounts/${encodeURIComponent(row.stripePromotionCodeId)}`,
                              {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ active: !row.active }),
                              }
                            );
                            if (!res.ok) return;
                            const refreshed = await fetch("/api/admin/business/discounts", {
                              cache: "no-store",
                            });
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

            {activeTab === "class-rules" ? (
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <h2 className="text-brand-dark text-lg">Class Timing Rules</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      These settings control when members can join, when credits are refunded, and
                      when empty classes auto-cancel.
                    </p>
                  </div>

                  {classRulesError ? (
                    <div
                      role="alert"
                      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                      {classRulesError}
                    </div>
                  ) : null}
                  {classRulesMessage ? (
                    <div
                      role="status"
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                    >
                      {classRulesMessage}
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2">
                    <ClassRuleField
                      label="Pre-join window"
                      hint="How many minutes before class the join room opens."
                      value={classRules?.preJoinWindowMinutes ?? 10}
                      onChange={(value) =>
                        setClassRules((current) => ({
                          ...(current || {
                            preJoinWindowMinutes: 10,
                            lateJoinCutoffMinutes: 5,
                            creditRefundWindowMinutes: 180,
                            emptyClassAutoCancelWindowMinutes: 180,
                          }),
                          preJoinWindowMinutes: value,
                        }))
                      }
                    />
                    <ClassRuleField
                      label="Late join cutoff"
                      hint="New joins close this many minutes after class starts."
                      value={classRules?.lateJoinCutoffMinutes ?? 5}
                      onChange={(value) =>
                        setClassRules((current) => ({
                          ...(current || {
                            preJoinWindowMinutes: 10,
                            lateJoinCutoffMinutes: 5,
                            creditRefundWindowMinutes: 180,
                            emptyClassAutoCancelWindowMinutes: 180,
                          }),
                          lateJoinCutoffMinutes: value,
                        }))
                      }
                    />
                    <ClassRuleField
                      label="Credit refund window"
                      hint="Bookings cancelled before this cutoff refund one credit."
                      value={classRules?.creditRefundWindowMinutes ?? 180}
                      onChange={(value) =>
                        setClassRules((current) => ({
                          ...(current || {
                            preJoinWindowMinutes: 10,
                            lateJoinCutoffMinutes: 5,
                            creditRefundWindowMinutes: 180,
                            emptyClassAutoCancelWindowMinutes: 180,
                          }),
                          creditRefundWindowMinutes: value,
                        }))
                      }
                    />
                    <ClassRuleField
                      label="Empty class auto-cancel window"
                      hint="If nobody is booked at this point, cancel the class and notify the instructor."
                      value={classRules?.emptyClassAutoCancelWindowMinutes ?? 180}
                      onChange={(value) =>
                        setClassRules((current) => ({
                          ...(current || {
                            preJoinWindowMinutes: 10,
                            lateJoinCutoffMinutes: 5,
                            creditRefundWindowMinutes: 180,
                            emptyClassAutoCancelWindowMinutes: 180,
                          }),
                          emptyClassAutoCancelWindowMinutes: value,
                        }))
                      }
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      disabled={!classRules || savingClassRules}
                      onClick={async () => {
                        if (!classRules) return;
                        setSavingClassRules(true);
                        setClassRulesError("");
                        setClassRulesMessage("");
                        try {
                          const response = await fetch("/api/admin/business/class-rules", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(classRules),
                          });
                          const payload = (await response.json().catch(() => null)) as unknown;

                          if (!response.ok) {
                            throw new Error(
                              getApiErrorMessage(
                                payload,
                                "Unable to save class timing rules right now."
                              )
                            );
                          }

                          if (!isApiSuccess<ClassOperationalSettingsDto>(payload)) {
                            throw new Error(
                              getApiErrorMessage(
                                payload,
                                "Unable to save class timing rules right now."
                              )
                            );
                          }

                          setClassRules(payload.data);
                          setClassRulesMessage("Class timing rules updated.");
                        } catch (error) {
                          setClassRulesError(
                            error instanceof Error
                              ? error.message
                              : "Unable to save class timing rules right now."
                          );
                        } finally {
                          setSavingClassRules(false);
                        }
                      }}
                    >
                      {savingClassRules ? "Saving..." : "Save Class Rules"}
                    </Button>
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

function ClassRuleField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-2">
      <div>
        <p className="text-sm">{label}</p>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </div>
      <Input
        type="number"
        min={0}
        value={String(value)}
        onChange={(event) => onChange(Number(event.target.value || 0))}
      />
    </label>
  );
}
