"use client";

import { useEffect, useState } from "react";
import { MembershipRefund } from "@/components/admin/membership-refund";
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
import { InlineLoadingStatus } from "@/components/loading-region";
import { useAdminSection } from "@/components/admin/use-admin-section";

export function AdminBusiness() {
  const [summary, setSummary] = useState<AdminBusinessMetricDto | null>(null);
  const [activeTab, setActiveTab] = useAdminSection(
    "section",
    ["health", "settings", "pricing", "discounts", "class-rules", "billing"] as const,
    "health"
  );
  const [catalog, setCatalog] = useState<
    Array<{ key: string; stripePriceId: string; unitAmountPence: number; currency: string }>
  >([]);
  const [discounts, setDiscounts] = useState<
    Array<{ stripePromotionCodeId: string; code: string; active: boolean; type: string }>
  >([]);
  const [newPriceKey, setNewPriceKey] = useState("membership_movewell_monthly");
  const [newPriceAmount, setNewPriceAmount] = useState("3500");
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
  const [dunningCases, setDunningCases] = useState<
    Array<{
      id: string;
      status: "open" | "suspended";
      memberName: string;
      memberEmail: string;
      membershipId: string;
      amountDuePence: number;
      invoiceUrl: string | null;
      graceEndsAt: string;
      suspendedAt: string | null;
    }>
  >([]);
  const [billingMessage, setBillingMessage] = useState("");
  const [billingError, setBillingError] = useState("");
  const [billingWorking, setBillingWorking] = useState(false);
  const [syncingSubscriptions, setSyncingSubscriptions] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const endpoints = {
      health: "/api/admin/business",
      settings: "/api/admin/business/settings",
      billing: "/api/admin/billing/dunning",
      pricing: "/api/admin/business/catalog",
      discounts: "/api/admin/business/discounts",
      "class-rules": "/api/admin/business/class-rules",
    };
    setLoading(true);
    setLoadError("");
    void (async () => {
      try {
        const response = await fetch(endpoints[activeTab], {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(
            "This section could not be loaded. Other business sections are still available."
          );
        const payload: unknown = await response.json();
        if (controller.signal.aborted) return;
        if (activeTab === "pricing" || activeTab === "discounts") {
          if (!Array.isArray(payload)) throw new Error("Unexpected response. Please retry.");
          if (activeTab === "pricing") setCatalog(payload as typeof catalog);
          else setDiscounts(payload as typeof discounts);
        } else if (isApiSuccess<unknown>(payload)) {
          if (activeTab === "health") setSummary(payload.data as AdminBusinessMetricDto);
          if (activeTab === "settings") setSettings(payload.data as PlatformSettingsDto);
          if (activeTab === "billing") setDunningCases(payload.data as typeof dunningCases);
          if (activeTab === "class-rules")
            setClassRules(payload.data as ClassOperationalSettingsDto);
        } else throw new Error("Unexpected response. Please retry.");
      } catch (error) {
        if (!controller.signal.aborted)
          setLoadError(error instanceof Error ? error.message : "Unable to load this section.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [activeTab, reloadKey]);

  return (
    <AdminLayout title="Business Overview - Shruti Turner">
      <div className="space-y-6">
        <AppPageHeader
          eyebrow="Business operations"
          title="Business"
          description={
            activeTab === "health"
              ? "Coaching subscription projections. These figures are not total business revenue."
              : "Manage the selected business settings and operations."
          }
          meta={
            summary?.dataFreshnessIso
              ? `Data freshness: ${new Date(summary.dataFreshnessIso).toLocaleString("en-GB")}`
              : undefined
          }
        />

        {loading ? <InlineLoadingStatus label="Loading section…" /> : null}
        {loadError ? (
          <div role="alert" className="rounded-lg border p-4">
            <p>{loadError}</p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => setReloadKey((value) => value + 1)}
            >
              Retry section
            </Button>
          </div>
        ) : null}
        {activeTab === "health" && !loading && !loadError && !summary ? (
          <p className="text-muted-foreground text-sm">No business metrics available.</p>
        ) : null}

        <>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeTab === "health" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("health")}
            >
              Overview
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("settings")}
            >
              Site settings
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
              Discounts
            </Button>
            <Button
              variant={activeTab === "class-rules" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("class-rules")}
            >
              Class rules
            </Button>
            <Button
              variant={activeTab === "billing" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("billing")}
            >
              Billing operations
            </Button>
          </div>

          {activeTab === "health" && !loading && !loadError && summary ? (
            <>
              <AppMetricGrid>
                <AppMetricCard
                  label="Active 1:1 clients"
                  value={summary.activeOneToOneClients}
                  detail={`${summary.operationalOneToOneClients} operational profiles`}
                />
                <AppMetricCard
                  label="MRR"
                  value={`£${Math.round(summary.monthlyRecurringRevenuePence / 100)}`}
                  detail={`${summary.trackedSubscriptions} Stripe subscriptions tracked`}
                />
                <AppMetricCard
                  label="New paid clients (MTD)"
                  value={summary.newPaidClientsThisMonth}
                  detail="subscriptions started this month"
                />
                <AppMetricCard
                  label="Ending in 30 days"
                  value={summary.endingSoonCount}
                  detail="scheduled subscription endings"
                />
              </AppMetricGrid>
              {summary.subscriptionsNeedingSync > 0 ? (
                <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  <p>
                    {summary.subscriptionsNeedingSync} coaching subscription
                    {summary.subscriptionsNeedingSync === 1 ? " needs" : "s need"} a Stripe sync.
                    Viewing this page never changes billing data.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    disabled={syncingSubscriptions}
                    onClick={async () => {
                      setSyncingSubscriptions(true);
                      setSyncMessage("");
                      try {
                        const response = await fetch("/api/admin/business/reconcile", {
                          method: "POST",
                        });
                        const payload = (await response.json().catch(() => null)) as unknown;
                        if (
                          !response.ok ||
                          !isApiSuccess<{ summary: AdminBusinessMetricDto }>(payload)
                        ) {
                          throw new Error(
                            getApiErrorMessage(payload, "Unable to sync from Stripe.")
                          );
                        }
                        setSummary(payload.data.summary);
                        setSyncMessage("Stripe subscription data is up to date.");
                        setReloadKey((value) => value + 1);
                      } catch (error) {
                        setSyncMessage(
                          error instanceof Error ? error.message : "Unable to sync from Stripe."
                        );
                      } finally {
                        setSyncingSubscriptions(false);
                      }
                    }}
                  >
                    {syncingSubscriptions ? "Syncing…" : "Sync from Stripe"}
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm" role="status">
                  {syncMessage || "Subscription projections are up to date."}
                </p>
              )}
              {syncMessage && summary.subscriptionsNeedingSync > 0 ? (
                <p className="text-muted-foreground text-sm" role="status">
                  {syncMessage}
                </p>
              ) : null}
              <AppMetricGrid className="lg:grid-cols-2">
                <AppMetricCard label="Failed payments (7d)" value={summary.failedPayments7d} />
                <AppMetricCard label="Failed payments (30d)" value={summary.failedPayments30d} />
              </AppMetricGrid>
            </>
          ) : null}

          {activeTab === "settings" && !loading && !loadError ? (
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <h2 className="text-brand-dark text-lg">Platform Settings</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Business details, default SEO metadata and analytics identifiers.
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

          {activeTab === "billing" && !loading && !loadError ? (
            <Card>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <h2 className="text-brand-dark text-lg">Billing Operations</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Open dunning cases and membership-only refunds.
                  </p>
                </div>

                {billingError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {billingError}
                  </div>
                ) : null}
                {billingMessage ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {billingMessage}
                  </div>
                ) : null}

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Payment recovery</h3>
                  {dunningCases.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No open dunning cases.</p>
                  ) : (
                    dunningCases.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-lg border p-4 text-sm md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-medium">
                            {item.memberName} · £{(item.amountDuePence / 100).toFixed(2)}
                          </p>
                          <p className="text-muted-foreground">
                            {item.memberEmail} · {item.status} · grace ends{" "}
                            {new Date(item.graceEndsAt).toLocaleDateString("en-GB")}
                          </p>
                          {item.invoiceUrl ? (
                            <a
                              href={item.invoiceUrl}
                              className="text-primary underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Stripe invoice
                            </a>
                          ) : null}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={billingWorking}
                          onClick={async () => {
                            setBillingWorking(true);
                            setBillingError("");
                            setBillingMessage("");
                            try {
                              const extension = new Date();
                              extension.setUTCDate(extension.getUTCDate() + 7);
                              const response = await fetch("/api/admin/billing/dunning", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  dunningCaseId: item.id,
                                  graceExtendedUntil: extension.toISOString(),
                                  reason: "Manual 7-day grace extension from billing ops.",
                                }),
                              });
                              const payload = await response.json().catch(() => null);
                              if (!response.ok) {
                                throw new Error(
                                  getApiErrorMessage(payload, "Failed to extend grace period.")
                                );
                              }
                              setBillingMessage("Grace period extended.");
                              setReloadKey((value) => value + 1);
                            } catch (error) {
                              setBillingError(
                                error instanceof Error
                                  ? error.message
                                  : "Failed to extend grace period."
                              );
                            } finally {
                              setBillingWorking(false);
                            }
                          }}
                        >
                          Extend 7 days
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                <MembershipRefund />
              </CardContent>
            </Card>
          ) : null}

          {activeTab === "pricing" && !loading && !loadError ? (
            <Card>
              <CardContent className="space-y-4 pt-6">
                <h2 className="text-brand-dark text-lg">Pricing Catalog</h2>
                <p className="text-muted-foreground text-sm">
                  New prices apply to future purchases. This does not change existing subscriptions
                  or prices already agreed with clients.
                </p>
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
                    <option value="coaching_independent_training_plan_monthly">
                      Coaching Monthly Support
                    </option>
                    <option value="coaching_guided_training_plan_monthly">
                      Coaching Weekly Support
                    </option>
                    <option value="coaching_one_to_one_coaching_monthly">
                      Coaching 1:1 Coaching
                    </option>
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

          {activeTab === "discounts" && !loading && !loadError ? (
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

          {activeTab === "class-rules" && !loading && !loadError ? (
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <h2 className="text-brand-dark text-lg">Class Timing Rules</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    These settings control when members can join, when credits are refunded and when
                    empty classes auto-cancel.
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
