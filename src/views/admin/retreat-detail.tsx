"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Download,
  MapPin,
  PoundSterling,
  Plus,
  Save,
  Send,
  Trash2,
  CirclePause,
  Globe2,
  Gift,
  Users,
  Video,
} from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { DetailSkeleton } from "@/components/dashboard-skeleton";
import { LoadingRegion } from "@/components/loading-region";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AdminRetreatDetailDto, AdminRetreatEvidenceDto } from "@/lib/api/types";
import { formatRetreatDateTimeRange } from "@/lib/retreats/presentation";

function formatCurrency(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function badgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "paid_in_full") return "default";
  if (status === "deposit_paid" || status === "balance_due") return "secondary";
  if (status === "cancelled") return "destructive";
  return "outline";
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function AdminRetreatDetail({
  initialData,
}: {
  initialData?: AdminRetreatDetailDto | null;
}) {
  const { id } = useParams<{ id: string }>();
  const [retreat, setRetreat] = useState<AdminRetreatDetailDto | null>(initialData || null);
  const [evidence, setEvidence] = useState<AdminRetreatEvidenceDto | null>(null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionLoading, setActionLoading] = useState<
    | ""
    | "online-room"
    | "balance-due"
    | "chaser"
    | "early-bird"
    | "status"
    | "cancellation"
    | "addon"
    | "room"
    | "gift-refund"
    | "gift-recipient"
    | "gift-cancellation"
    | "replay"
    | "configuration"
    | "event-cancellation"
    | "access-email"
    | "community-mode"
  >("");
  const [earlyBirdDrafts, setEarlyBirdDrafts] = useState<
    Record<string, { pricePounds: string; endsAt: string }>
  >({});
  const [addonDraft, setAddonDraft] = useState({
    name: "",
    description: "",
    pricePounds: "",
    totalQuantity: "",
  });
  const [inventoryDrafts, setInventoryDrafts] = useState<Record<string, { totalQuantity: string }>>(
    {}
  );
  const [roomOptionDrafts, setRoomOptionDrafts] = useState<
    Record<string, { inventoryPoolId: string; inventoryUnitsPerBooking: string; capacity: string }>
  >({});
  const [paymentDraft, setPaymentDraft] = useState({
    depositType: "percentage" as "percentage" | "fixed_amount" | "full_payment",
    depositValue: "20",
    balanceDueDaysBeforeStart: "56",
  });

  useEffect(() => {
    if (!retreat) return;
    setEarlyBirdDrafts(
      Object.fromEntries(
        retreat.ratePlans.map((ratePlan) => [
          ratePlan.id,
          {
            pricePounds:
              ratePlan.earlyBirdPricePence === null
                ? ""
                : (ratePlan.earlyBirdPricePence / 100).toFixed(2),
            endsAt: toDateTimeLocal(ratePlan.earlyBirdEndsAt),
          },
        ])
      )
    );
    setInventoryDrafts(
      Object.fromEntries(
        retreat.inventoryPools.map((pool) => [
          pool.id,
          { totalQuantity: String(pool.totalQuantity) },
        ])
      )
    );
    setRoomOptionDrafts(
      Object.fromEntries(
        retreat.roomOptions.map((option) => [
          option.id,
          {
            inventoryPoolId: option.inventoryPoolId || "",
            inventoryUnitsPerBooking: String(option.inventoryUnitsPerBooking),
            capacity: String(option.capacity),
          },
        ])
      )
    );
    const rule = retreat.depositRule;
    setPaymentDraft({
      depositType: rule?.depositType || "full_payment",
      depositValue:
        rule?.depositType === "percentage"
          ? String((rule.depositPercentageBasisPoints || 0) / 100)
          : rule?.depositType === "fixed_amount"
            ? String((rule.fixedDepositAmountPence || 0) / 100)
            : "",
      balanceDueDaysBeforeStart: String(rule?.balanceDueDaysBeforeStart ?? 56),
    });
  }, [retreat]);

  useEffect(() => {
    if (initialData || !id) return;
    let active = true;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/admin/retreats/${id}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load retreat detail.");
        const payload = (await response.json()) as AdminRetreatDetailDto;
        if (active) setRetreat(payload);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load retreat detail."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, initialData]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    void (async () => {
      try {
        const response = await fetch(`/api/admin/retreats/${id}/evidence`, { cache: "no-store" });
        if (response.status === 401 || response.status === 403) {
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to load retreat evidence.");
        }
        const payload = (await response.json()) as AdminRetreatEvidenceDto;
        if (active) {
          setEvidence(payload);
        }
      } catch {
        if (active) {
          setEvidence(null);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const summary = useMemo(() => {
    if (!retreat) return null;
    const paidInFull = retreat.bookings.filter(
      (booking) => booking.paymentStatus === "paid_in_full"
    ).length;
    const balanceDue = retreat.bookings.filter(
      (booking) => booking.paymentStatus === "deposit_paid"
    ).length;
    const specialRequirements = retreat.bookings.filter(
      (booking) => booking.dietaryRequirements || booking.medicalConditions || booking.mobilityNeeds
    );
    return { paidInFull, balanceDue, specialRequirements };
  }, [retreat]);

  const runRetreatAction = async (
    action:
      | "online-room"
      | "balance-due"
      | "chaser"
      | "status"
      | "addon"
      | "room"
      | "gift-refund"
      | "gift-recipient"
      | "gift-cancellation"
      | "replay"
      | "configuration"
      | "event-cancellation"
      | "access-email",
    request: () => Promise<Response>
  ) => {
    setActionLoading(action);
    setActionMessage("");
    setError("");
    try {
      const response = await request();
      const payload = (await response.json().catch(() => null)) as
        | AdminRetreatDetailDto
        | { sent?: number; skipped?: number; message?: string; errors?: string[] }
        | null;
      if (!response.ok) {
        const message =
          payload && "message" in payload && payload.message
            ? payload.message
            : "The retreat action failed.";
        const details =
          payload && "errors" in payload && payload.errors?.length
            ? ` ${payload.errors.join(" ")}`
            : "";
        throw new Error(`${message}${details}`);
      }
      if (
        (action === "online-room" ||
          action === "status" ||
          action === "addon" ||
          action === "room" ||
          action === "gift-refund" ||
          action === "gift-recipient" ||
          action === "replay" ||
          action === "configuration" ||
          action === "event-cancellation" ||
          action === "access-email") &&
        payload &&
        "id" in payload
      ) {
        setRetreat(payload);
        setActionMessage(
          action === "online-room"
            ? "Online room created."
            : action === "addon"
              ? "Optional extras updated."
              : action === "room"
                ? "Room assignment updated."
                : action === "gift-refund"
                  ? "Gift purchase cancelled and refund submitted."
                  : action === "gift-recipient"
                    ? "Gift invitation updated and resent."
                    : action === "event-cancellation"
                      ? "Workshop cancelled. Refund processing has started."
                      : action === "access-email"
                        ? "Workshop setup/access email sent."
                        : action === "replay"
                          ? "Replay access updated."
                          : action === "configuration"
                            ? "Inventory and payment rules updated."
                            : "Status updated."
        );
      } else if (payload && "sent" in payload) {
        setActionMessage(`Emails sent: ${payload.sent}. Skipped: ${payload.skipped ?? 0}.`);
      } else {
        setActionMessage("Action complete.");
      }
      return true;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "The retreat action failed.");
      return false;
    } finally {
      setActionLoading("");
    }
  };

  const createAddon = async () => {
    if (!retreat) return;
    const pricePence = Math.round(Number(addonDraft.pricePounds) * 100);
    const totalQuantity = addonDraft.totalQuantity.trim() ? Number(addonDraft.totalQuantity) : null;
    if (!addonDraft.name.trim()) {
      setError("Enter a name for the optional extra.");
      return;
    }
    if (!Number.isInteger(pricePence) || pricePence < 0) {
      setError("Enter a valid price for the optional extra.");
      return;
    }
    if (totalQuantity !== null && (!Number.isInteger(totalQuantity) || totalQuantity < 1)) {
      setError("Quantity must be a whole number greater than zero, or left blank.");
      return;
    }

    const succeeded = await runRetreatAction("addon", () =>
      fetch(`/api/admin/retreats/${retreat.id}/addons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addonDraft.name,
          description: addonDraft.description || null,
          pricePence,
          totalQuantity,
        }),
      })
    );
    if (succeeded) {
      setAddonDraft({ name: "", description: "", pricePounds: "", totalQuantity: "" });
    }
  };

  const removeAddon = async (addonId: string, addonName: string) => {
    if (!retreat) return;
    if (!window.confirm(`Remove ${addonName} from this retreat date?`)) return;
    await runRetreatAction("addon", () =>
      fetch(`/api/admin/retreats/${retreat.id}/addons?addonId=${encodeURIComponent(addonId)}`, {
        method: "DELETE",
      })
    );
  };

  const saveConfiguration = async () => {
    if (!retreat) return;
    const inventoryPools = retreat.inventoryPools.map((pool) => ({
      id: pool.id,
      totalQuantity: Number(inventoryDrafts[pool.id]?.totalQuantity),
    }));
    const roomOptions = retreat.roomOptions.map((option) => {
      const draft = roomOptionDrafts[option.id];
      return {
        id: option.id,
        inventoryPoolId: draft?.inventoryPoolId || "",
        inventoryUnitsPerBooking: Number(draft?.inventoryUnitsPerBooking),
        capacity: Number(draft?.capacity),
      };
    });
    const depositNumber = Number(paymentDraft.depositValue);
    const balanceDays = Number(paymentDraft.balanceDueDaysBeforeStart);
    if (
      inventoryPools.some(
        (pool) => !Number.isInteger(pool.totalQuantity) || pool.totalQuantity < 1
      ) ||
      roomOptions.some(
        (option) =>
          !option.inventoryPoolId ||
          !Number.isInteger(option.inventoryUnitsPerBooking) ||
          option.inventoryUnitsPerBooking < 1 ||
          !Number.isInteger(option.capacity) ||
          option.capacity < 1
      )
    ) {
      setError("Inventory quantities must be whole numbers greater than zero.");
      return;
    }
    if (
      (paymentDraft.depositType === "percentage" &&
        (!Number.isFinite(depositNumber) || depositNumber <= 0 || depositNumber > 100)) ||
      (paymentDraft.depositType === "fixed_amount" &&
        (!Number.isFinite(depositNumber) || depositNumber < 0)) ||
      (paymentDraft.depositType !== "full_payment" &&
        (!Number.isInteger(balanceDays) || balanceDays < 0))
    ) {
      setError("Enter a valid deposit and balance deadline.");
      return;
    }

    await runRetreatAction("configuration", () =>
      fetch(`/api/admin/retreats/${retreat.id}/configuration`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryPools,
          roomOptions,
          payment: {
            depositType: paymentDraft.depositType,
            depositPercentageBasisPoints:
              paymentDraft.depositType === "percentage" ? Math.round(depositNumber * 100) : null,
            fixedDepositAmountPence:
              paymentDraft.depositType === "fixed_amount" ? Math.round(depositNumber * 100) : null,
            balanceDueDaysBeforeStart:
              paymentDraft.depositType === "full_payment" ? null : balanceDays,
          },
        }),
      })
    );
  };

  const saveEarlyBirdRates = async () => {
    setActionLoading("early-bird");
    setActionMessage("");
    setError("");
    try {
      const ratePlans = retreat.ratePlans.map((ratePlan) => {
        const draft = earlyBirdDrafts[ratePlan.id] || { pricePounds: "", endsAt: "" };
        const hasPrice = draft.pricePounds.trim().length > 0;
        const hasEndDate = draft.endsAt.length > 0;
        if (hasPrice !== hasEndDate) {
          throw new Error(
            `${ratePlan.roomLabel} for ${ratePlan.guestCount} ${ratePlan.guestCount === 1 ? "guest" : "guests"} needs both a price and deadline.`
          );
        }
        if (!hasPrice) {
          return {
            ratePlanId: ratePlan.id,
            earlyBirdPricePence: null,
            earlyBirdEndsAt: null,
          };
        }
        const earlyBirdPricePence = Math.round(Number(draft.pricePounds) * 100);
        if (
          !Number.isFinite(earlyBirdPricePence) ||
          earlyBirdPricePence < 0 ||
          earlyBirdPricePence >= ratePlan.totalPricePence
        ) {
          throw new Error(
            `${ratePlan.roomLabel} early-bird price must be lower than the standard price.`
          );
        }
        return {
          ratePlanId: ratePlan.id,
          earlyBirdPricePence,
          earlyBirdEndsAt: new Date(draft.endsAt).toISOString(),
        };
      });

      const response = await fetch(`/api/admin/retreats/${retreat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratePlans }),
      });
      const payload = (await response.json().catch(() => null)) as
        | AdminRetreatDetailDto
        | { message?: string }
        | null;
      if (!response.ok || !payload || !("id" in payload)) {
        throw new Error(
          payload && "message" in payload && payload.message
            ? payload.message
            : "Failed to update early-bird pricing."
        );
      }
      setRetreat(payload);
      setActionMessage("Early-bird deadlines updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update pricing.");
    } finally {
      setActionLoading("");
    }
  };

  const updateCommunityMode = async (enabled: boolean) => {
    if (!retreat || retreat.retreatType !== "online") return;
    setActionLoading("community-mode");
    setActionMessage("");
    setError("");
    try {
      const response = await fetch(`/api/retreats/host/${retreat.id}/display-mode`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: enabled ? "gallery" : "presenter" }),
      });
      const payload = (await response.json().catch(() => null)) as {
        displayMode?: "gallery" | "presenter";
        displayVersion?: number;
        focusedPresenterUserId?: string | null;
        message?: string;
      } | null;
      if (!response.ok || !payload?.displayMode) {
        throw new Error(payload?.message || "Unable to update community mode.");
      }
      setRetreat((current) =>
        current
          ? {
              ...current,
              liveDisplayMode: payload.displayMode!,
              liveDisplayVersion: payload.displayVersion ?? current.liveDisplayVersion,
              focusedPresenterUserId:
                payload.focusedPresenterUserId ??
                (payload.displayMode === "gallery" ? null : current.focusedPresenterUserId),
            }
          : current
      );
      setActionMessage(
        enabled
          ? "Community mode will show everyone in the workshop."
          : "Community mode is off; attendees will use presenter view."
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Unable to update community mode."
      );
    } finally {
      setActionLoading("");
    }
  };

  const decideCancellation = async (requestId: string, action: "approve" | "reject") => {
    if (!retreat) return;
    const reason = window.prompt(
      action === "approve"
        ? "Optional note to include with the approval:"
        : "Explain why this request is being rejected:"
    );
    if (reason === null || (action === "reject" && !reason.trim())) return;
    if (
      action === "approve" &&
      !window.confirm(
        "Approve this cancellation and submit the calculated refund to Stripe? This cannot be undone from this screen."
      )
    ) {
      return;
    }
    setActionLoading("cancellation");
    setActionMessage("");
    setError("");
    try {
      const response = await fetch(`/api/admin/retreats/cancellations/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { success: true; data: { status: string } }
        | { success: false; error: { message: string } }
        | null;
      if (!response.ok || !payload || !payload.success) {
        throw new Error(
          payload && payload.success === false
            ? payload.error.message
            : "Failed to decide cancellation."
        );
      }
      const detailResponse = await fetch(`/api/admin/retreats/${retreat.id}`, {
        cache: "no-store",
      });
      if (!detailResponse.ok) throw new Error("Cancellation updated, but refresh failed.");
      setRetreat((await detailResponse.json()) as AdminRetreatDetailDto);
      setActionMessage(
        action === "approve" ? "Cancellation approved." : "Cancellation request rejected."
      );
    } catch (decisionError) {
      setError(
        decisionError instanceof Error ? decisionError.message : "Failed to decide cancellation."
      );
    } finally {
      setActionLoading("");
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Retreat - Admin">
        <LoadingRegion label="Loading retreat administration">
          <DetailSkeleton />
        </LoadingRegion>
      </AdminLayout>
    );
  }

  if (!retreat) {
    return (
      <AdminLayout title="Retreat - Admin">
        <div className="py-16 text-center">
          <p className="text-muted-foreground">{error || "Retreat not found."}</p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/admin/retreats">Back to retreats</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`${retreat.title} - Admin`}>
      <div className="space-y-6">
        <Link
          href="/admin/retreats"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to retreats
        </Link>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-brand-dark text-2xl">{retreat.title}</h1>
            <div className="text-muted-foreground mt-2 flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {retreat.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatRetreatDateTimeRange(retreat.startDate, retreat.endDate, retreat.timezone)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{retreat.status.replaceAll("_", " ")}</Badge>
            {retreat.status === "draft" || retreat.status === "closed" ? (
              <Button
                type="button"
                disabled={actionLoading !== ""}
                onClick={() =>
                  void runRetreatAction("status", () =>
                    fetch(`/api/admin/retreats/${retreat.id}/status`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "open" }),
                    })
                  )
                }
              >
                <Globe2 className="mr-2 h-4 w-4" />
                {retreat.status === "draft" ? "Publish" : "Reopen bookings"}
              </Button>
            ) : null}
            {retreat.status === "open" || retreat.status === "sold_out" ? (
              <Button
                type="button"
                variant="outline"
                disabled={actionLoading !== ""}
                onClick={() =>
                  void runRetreatAction("status", () =>
                    fetch(`/api/admin/retreats/${retreat.id}/status`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "closed" }),
                    })
                  )
                }
              >
                <CirclePause className="mr-2 h-4 w-4" />
                Close bookings
              </Button>
            ) : null}
            {retreat.retreatType === "online" &&
            !["cancelled", "completed"].includes(retreat.status) ? (
              <Button
                type="button"
                variant="destructive"
                disabled={actionLoading !== ""}
                onClick={() => {
                  const reason = window.prompt(
                    `Why is ${retreat.title} being cancelled? This will close access and issue full refunds.`,
                    ""
                  );
                  if (!reason?.trim()) return;
                  if (
                    !window.confirm(
                      `Cancel ${retreat.title} for ${retreat.bookings.length} booking(s) and ${retreat.gifts.length} gift purchase(s)? Full refunds will begin immediately.`
                    )
                  ) {
                    return;
                  }
                  void runRetreatAction("event-cancellation", () =>
                    fetch(`/api/admin/retreats/${retreat.id}/cancel`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ reason }),
                    })
                  );
                }}
              >
                Cancel workshop
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={() =>
                downloadCsv(`${retreat.retreatSlug}-attendees.csv`, [
                  [
                    "Purchaser",
                    "Purchaser Email",
                    "Attendee",
                    "Attendee Email",
                    "Room Type",
                    "Assigned Room",
                    "Attendee Count",
                    "Optional Extras",
                    "Payment Status",
                    "Booking Status",
                    "Dietary",
                    "Medical",
                    "Mobility",
                  ],
                  ...retreat.bookings.map((booking) => [
                    booking.purchaserName,
                    booking.purchaserEmail,
                    booking.attendeeName,
                    booking.attendeeEmail,
                    booking.roomType || "",
                    booking.roomUnitLabel || "",
                    String(booking.attendeeCount || 1),
                    booking.addons.map((addon) => `${addon.name} x ${addon.quantity}`).join("; "),
                    booking.paymentStatus,
                    booking.bookingStatus,
                    booking.dietaryRequirements || "",
                    booking.medicalConditions || "",
                    booking.mobilityNeeds || "",
                  ]),
                ])
              }
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        ) : null}
        {actionMessage ? (
          <div
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
          >
            {actionMessage}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="text-brand-accent mx-auto h-5 w-5" />
              <p className="mt-2 text-2xl">{retreat.bookings.length}</p>
              <p className="text-muted-foreground text-xs">Bookings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <PoundSterling className="text-brand-accent mx-auto h-5 w-5" />
              <p className="mt-2 text-2xl">{formatCurrency(retreat.revenuePence)}</p>
              <p className="text-muted-foreground text-xs">Captured revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="mt-2 text-2xl">{summary?.paidInFull || 0}</p>
              <p className="text-muted-foreground text-xs">Paid in full</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="mt-2 text-2xl">{summary?.balanceDue || 0}</p>
              <p className="text-muted-foreground text-xs">Balance still due</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Early-bird pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-muted-foreground text-sm">
                Published prices are locked so guests see the same offer. You can extend an existing
                early-bird deadline, but cannot change, add or remove its price.
              </p>
              <div className="space-y-4">
                {retreat.ratePlans.map((ratePlan) => {
                  const draft = earlyBirdDrafts[ratePlan.id] || {
                    pricePounds: "",
                    endsAt: "",
                  };
                  const label = `${ratePlan.roomLabel} · ${ratePlan.guestCount} ${ratePlan.guestCount === 1 ? "guest" : "guests"}`;
                  return (
                    <div
                      key={ratePlan.id}
                      className="grid gap-4 rounded-lg border p-4 md:grid-cols-[1.2fr_0.8fr_1fr] md:items-end"
                    >
                      <div>
                        <p className="font-medium">{label}</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          Standard price {formatCurrency(ratePlan.totalPricePence)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`early-price-${ratePlan.id}`}>Early-bird price (£)</Label>
                        <Input
                          id={`early-price-${ratePlan.id}`}
                          type="number"
                          min="0"
                          max={(ratePlan.totalPricePence - 1) / 100}
                          step="0.01"
                          value={draft.pricePounds}
                          disabled={retreat.pricingLocked}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`early-end-${ratePlan.id}`}>Available until</Label>
                        <Input
                          id={`early-end-${ratePlan.id}`}
                          type="datetime-local"
                          min={toDateTimeLocal(ratePlan.earlyBirdEndsAt)}
                          max={toDateTimeLocal(retreat.startDate)}
                          value={draft.endsAt}
                          disabled={ratePlan.earlyBirdPricePence === null}
                          onChange={(event) =>
                            setEarlyBirdDrafts((current) => ({
                              ...current,
                              [ratePlan.id]: { ...draft, endsAt: event.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button
                type="button"
                disabled={
                  actionLoading !== "" ||
                  !retreat.ratePlans.some((ratePlan) => ratePlan.earlyBirdPricePence !== null)
                }
                onClick={() => void saveEarlyBirdRates()}
              >
                <Save className="mr-2 h-4 w-4" />
                {actionLoading === "early-bird" ? "Saving..." : "Save early-bird deadlines"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {retreat.retreatType === "online" ? "Ticket inventory" : "Accommodation inventory"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground text-sm">
                Pools represent the real underlying stock. Options sharing a pool automatically
                reduce one another. For a convertible twin/king room, use a pool of 2 base units,
                set a shared bed to consume 1 and the whole king room to consume 2.
              </p>

              <div className="space-y-3">
                <h3 className="font-medium">Inventory pools</h3>
                {retreat.inventoryPools.map((pool) => (
                  <div
                    key={pool.id}
                    className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_10rem] sm:items-end"
                  >
                    <div>
                      <p className="font-medium">{pool.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {pool.inventoryType.replaceAll("_", " ")}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`pool-quantity-${pool.id}`}>Base units</Label>
                      <Input
                        id={`pool-quantity-${pool.id}`}
                        type="number"
                        min="1"
                        step="1"
                        disabled={retreat.pricingLocked}
                        value={inventoryDrafts[pool.id]?.totalQuantity || ""}
                        onChange={(event) =>
                          setInventoryDrafts((current) => ({
                            ...current,
                            [pool.id]: { totalQuantity: event.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Sellable options</h3>
                {retreat.roomOptions.map((option) => {
                  const draft = roomOptionDrafts[option.id] || {
                    inventoryPoolId: "",
                    inventoryUnitsPerBooking: "1",
                    capacity: "1",
                  };
                  return (
                    <div key={option.id} className="rounded-lg border p-4">
                      <p className="font-medium">{option.label}</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor={`option-pool-${option.id}`}>Shared pool</Label>
                          <select
                            id={`option-pool-${option.id}`}
                            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                            disabled={retreat.pricingLocked}
                            value={draft.inventoryPoolId}
                            onChange={(event) =>
                              setRoomOptionDrafts((current) => ({
                                ...current,
                                [option.id]: { ...draft, inventoryPoolId: event.target.value },
                              }))
                            }
                          >
                            <option value="">Choose a pool</option>
                            {retreat.inventoryPools.map((pool) => (
                              <option key={pool.id} value={pool.id}>
                                {pool.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`option-units-${option.id}`}>Units consumed</Label>
                          <Input
                            id={`option-units-${option.id}`}
                            type="number"
                            min="1"
                            step="1"
                            disabled={retreat.pricingLocked}
                            value={draft.inventoryUnitsPerBooking}
                            onChange={(event) =>
                              setRoomOptionDrafts((current) => ({
                                ...current,
                                [option.id]: {
                                  ...draft,
                                  inventoryUnitsPerBooking: event.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`option-capacity-${option.id}`}>Maximum bookings</Label>
                          <Input
                            id={`option-capacity-${option.id}`}
                            type="number"
                            min="1"
                            step="1"
                            disabled={retreat.pricingLocked}
                            value={draft.capacity}
                            onChange={(event) =>
                              setRoomOptionDrafts((current) => ({
                                ...current,
                                [option.id]: { ...draft, capacity: event.target.value },
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment structure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {retreat.status === "draft" ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="deposit-type">Payment rule</Label>
                    <select
                      id="deposit-type"
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                      value={paymentDraft.depositType}
                      onChange={(event) =>
                        setPaymentDraft((current) => ({
                          ...current,
                          depositType: event.target.value as typeof current.depositType,
                        }))
                      }
                    >
                      <option value="percentage">Percentage deposit</option>
                      <option value="fixed_amount">Fixed deposit</option>
                      <option value="full_payment">Full payment</option>
                    </select>
                  </div>
                  {paymentDraft.depositType !== "full_payment" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="deposit-value">
                          {paymentDraft.depositType === "percentage"
                            ? "Deposit (%)"
                            : "Deposit (£)"}
                        </Label>
                        <Input
                          id="deposit-value"
                          type="number"
                          min={paymentDraft.depositType === "percentage" ? "0.01" : "0"}
                          max={paymentDraft.depositType === "percentage" ? "100" : undefined}
                          step="0.01"
                          value={paymentDraft.depositValue}
                          onChange={(event) =>
                            setPaymentDraft((current) => ({
                              ...current,
                              depositValue: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="balance-days">Balance due (days before start)</Label>
                        <Input
                          id="balance-days"
                          type="number"
                          min="0"
                          step="1"
                          value={paymentDraft.balanceDueDaysBeforeStart}
                          onChange={(event) =>
                            setPaymentDraft((current) => ({
                              ...current,
                              balanceDueDaysBeforeStart: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Retreat price
                  </p>
                  <p className="mt-1">{formatCurrency(retreat.pricePence)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Payment policy
                  </p>
                  <p className="mt-1">
                    {retreat.paymentPolicy === "full_payment"
                      ? "Full payment required"
                      : `Deposit ${formatCurrency(retreat.depositAmountPence)}`}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Single room supplement
                  </p>
                  <p className="mt-1">{formatCurrency(retreat.singleRoomSupplementPence)}</p>
                </div>
                <div className="sm:col-span-3">
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Balance due date
                  </p>
                  <p className="mt-1">
                    {retreat.paymentPolicy === "full_payment"
                      ? "No balance; full payment is taken at checkout"
                      : retreat.balanceDueAt
                        ? new Intl.DateTimeFormat("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }).format(new Date(retreat.balanceDueAt))
                        : "Before arrival"}
                  </p>
                </div>
              </div>
              {retreat.status === "draft" ? (
                <Button
                  type="button"
                  disabled={actionLoading !== ""}
                  onClick={() => void saveConfiguration()}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {actionLoading === "configuration"
                    ? "Saving..."
                    : "Save inventory and payment rules"}
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Optional extras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-muted-foreground text-sm">
                Extras are priced and stocked for this retreat date. They can only be changed while
                the date is a draft, before bookings open.
              </p>

              {retreat.addons.length > 0 ? (
                <div className="space-y-3">
                  {retreat.addons.map((addon) => (
                    <div
                      key={addon.id}
                      className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">{addon.name}</p>
                        {addon.description ? (
                          <p className="text-muted-foreground mt-1 text-sm">{addon.description}</p>
                        ) : null}
                        <p className="text-muted-foreground mt-2 text-xs">
                          {formatCurrency(addon.pricePence)} ·{" "}
                          {addon.totalQuantity === null
                            ? "No quantity limit"
                            : `${addon.availableQuantity ?? 0} of ${addon.totalQuantity} available`}
                        </p>
                      </div>
                      {retreat.status === "draft" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          title={`Remove ${addon.name}`}
                          aria-label={`Remove ${addon.name}`}
                          disabled={actionLoading !== ""}
                          onClick={() => void removeAddon(addon.id, addon.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No optional extras configured.</p>
              )}

              {retreat.status === "draft" ? (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="addon-name">Name</Label>
                      <Input
                        id="addon-name"
                        value={addonDraft.name}
                        onChange={(event) =>
                          setAddonDraft((current) => ({ ...current, name: event.target.value }))
                        }
                        placeholder="For example, massage appointment"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addon-description">Description</Label>
                      <Input
                        id="addon-description"
                        value={addonDraft.description}
                        onChange={(event) =>
                          setAddonDraft((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        placeholder="Shown during checkout"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addon-price">Price (£)</Label>
                      <Input
                        id="addon-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={addonDraft.pricePounds}
                        onChange={(event) =>
                          setAddonDraft((current) => ({
                            ...current,
                            pricePounds: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addon-quantity">Available quantity (optional)</Label>
                      <Input
                        id="addon-quantity"
                        type="number"
                        min="1"
                        step="1"
                        value={addonDraft.totalQuantity}
                        onChange={(event) =>
                          setAddonDraft((current) => ({
                            ...current,
                            totalQuantity: event.target.value,
                          }))
                        }
                        placeholder="Unlimited"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={actionLoading !== ""}
                    onClick={() => void createAddon()}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {actionLoading === "addon" ? "Saving..." : "Add optional extra"}
                  </Button>
                  {retreat.replayAssets[0] ? (
                    <div className="mt-4 rounded-lg border p-4">
                      <p className="font-medium">Replay</p>
                      <p className="text-muted-foreground mt-1">
                        Recording status: {retreat.replayAssets[0].status.replaceAll("_", " ")}
                      </p>
                      <p className="text-muted-foreground mt-1">
                        {retreat.replayPublished
                          ? "Published to eligible attendees."
                          : "Not published. Recording readiness never grants access automatically."}
                      </p>
                      <Button
                        type="button"
                        variant={retreat.replayPublished ? "outline" : "default"}
                        className="mt-3 w-full"
                        disabled={
                          actionLoading !== "" || retreat.replayAssets[0].status !== "ready"
                        }
                        onClick={() =>
                          void runRetreatAction("replay", () =>
                            fetch(`/api/admin/retreats/${retreat.id}/replay`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                action: retreat.replayPublished ? "revoke" : "publish",
                                replayAssetId: retreat.replayAssets[0].id,
                              }),
                            })
                          )
                        }
                      >
                        {retreat.replayPublished ? "Revoke replay access" : "Publish replay"}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Operational actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {retreat.retreatType === "online" ? (
                <div className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <Video className="text-brand-accent mt-1 h-5 w-5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">Online room</p>
                      <p className="text-muted-foreground mt-1">
                        Status: {retreat.roomSetupStatus.replaceAll("_", " ")}
                      </p>
                      {retreat.liveRoomPrepared ? (
                        <Link
                          href={`/dashboard/retreats/host/${retreat.id}`}
                          className="text-brand-accent mt-2 inline-flex items-center gap-1 underline"
                        >
                          Open protected host room
                        </Link>
                      ) : null}
                      {retreat.roomSetupError ? (
                        <p className="mt-2 text-red-700">{retreat.roomSetupError}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="bg-secondary/20 mt-4 flex items-start justify-between gap-4 rounded-lg border p-3">
                    <div>
                      <Label htmlFor="retreat-community-mode">Community mode</Label>
                      <p
                        id="retreat-community-mode-description"
                        className="text-muted-foreground mt-1 text-xs"
                      >
                        When off, attendees use presenter view instead of seeing the full workshop
                        gallery. The host can still change this during the session.
                      </p>
                    </div>
                    <Switch
                      id="retreat-community-mode"
                      checked={retreat.liveDisplayMode === "gallery"}
                      disabled={actionLoading !== ""}
                      aria-describedby="retreat-community-mode-description"
                      onCheckedChange={(checked) => void updateCommunityMode(checked)}
                    />
                  </div>
                  <Button
                    type="button"
                    className="mt-4 w-full"
                    disabled={actionLoading !== ""}
                    onClick={() =>
                      void runRetreatAction("online-room", () =>
                        fetch(`/api/admin/retreats/${retreat.id}/online-room`, {
                          method: "POST",
                        })
                      )
                    }
                  >
                    <Video className="mr-2 h-4 w-4" />
                    {actionLoading === "online-room" ? "Preparing..." : "Prepare live room"}
                  </Button>
                </div>
              ) : null}

              <div className="rounded-lg border p-4">
                <p className="font-medium">Balance emails</p>
                <p className="text-muted-foreground mt-1">
                  Send the balance due email when balances are ready to collect. Use chasers after
                  the first due email has gone out.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={actionLoading !== ""}
                    onClick={() =>
                      void runRetreatAction("balance-due", () =>
                        fetch(`/api/admin/retreats/${retreat.id}/balance-emails`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ mode: "due" }),
                        })
                      )
                    }
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {actionLoading === "balance-due" ? "Sending..." : "Send due email"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={actionLoading !== ""}
                    onClick={() =>
                      void runRetreatAction("chaser", () =>
                        fetch(`/api/admin/retreats/${retreat.id}/balance-emails`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ mode: "chaser" }),
                        })
                      )
                    }
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {actionLoading === "chaser" ? "Sending..." : "Send chaser"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {evidence ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Owner-admin legal evidence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 text-sm">
                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Guest bookings
                  </p>
                  {evidence.bookings.length === 0 ? (
                    <p className="text-muted-foreground">No guest acceptance evidence recorded.</p>
                  ) : (
                    evidence.bookings.map((booking) => (
                      <div key={booking.id} className="rounded-lg border p-3">
                        <p className="font-medium">{booking.purchaserEmail}</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Booking {booking.id} · {booking.bookingStatus} · {booking.paymentStatus}
                        </p>
                        <div className="mt-3 space-y-2">
                          {booking.guestAcceptances.map((event) => (
                            <div key={event.id} className="bg-muted/40 rounded-md px-3 py-2">
                              <p>
                                {event.type.replaceAll("_", " ")} · {event.version}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {new Date(event.acceptedAt).toLocaleString("en-GB")} ·{" "}
                                {event.surface}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Guest gifts
                  </p>
                  {evidence.gifts.length === 0 ? (
                    <p className="text-muted-foreground">No guest gift evidence recorded.</p>
                  ) : (
                    evidence.gifts.map((gift) => (
                      <div key={gift.id} className="rounded-lg border p-3">
                        <p className="font-medium">{gift.purchaserEmail}</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Gift {gift.id} · {gift.status} · Recipient {gift.recipientEmail}
                        </p>
                        <div className="mt-3 space-y-2">
                          {gift.guestAcceptances.map((event) => (
                            <div key={event.id} className="bg-muted/40 rounded-md px-3 py-2">
                              <p>
                                {event.type.replaceAll("_", " ")} · {event.version}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {new Date(event.acceptedAt).toLocaleString("en-GB")} ·{" "}
                                {event.surface}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="text-brand-accent h-5 w-5" />
                Special requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {summary && summary.specialRequirements.length > 0 ? (
                summary.specialRequirements.map((booking) => (
                  <div key={booking.id} className="rounded-lg border p-4">
                    <p>{booking.attendeeName}</p>
                    {booking.dietaryRequirements ? (
                      <p className="text-muted-foreground mt-2">
                        Dietary: {booking.dietaryRequirements}
                      </p>
                    ) : null}
                    {booking.medicalConditions ? (
                      <p className="text-muted-foreground mt-1">
                        Medical: {booking.medicalConditions}
                      </p>
                    ) : null}
                    {booking.mobilityNeeds ? (
                      <p className="text-muted-foreground mt-1">
                        Mobility: {booking.mobilityNeeds}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No special requirements have been recorded.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {retreat.gifts.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gift className="text-brand-accent h-5 w-5" />
                Gift purchases
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-muted-foreground border-b">
                  <tr>
                    <th className="py-3 pr-4">Purchaser</th>
                    <th className="py-3 pr-4">Recipient</th>
                    <th className="py-3 pr-4">Place</th>
                    <th className="py-3 pr-4">Payment</th>
                    <th className="py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {retreat.gifts.map((gift) => (
                    <tr key={gift.id} className="border-border/50 border-b">
                      <td className="py-3 pr-4">
                        <p>{gift.purchaserName}</p>
                        <p className="text-muted-foreground mt-1 text-xs">{gift.purchaserEmail}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <p>{gift.recipientName}</p>
                        <p className="text-muted-foreground mt-1 text-xs">{gift.recipientEmail}</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {gift.deliveryEmailSentAt
                            ? `Invite sent to ${gift.deliveryTarget === "buyer" ? "buyer" : "recipient"}`
                            : "Invite pending"}
                        </p>
                        {retreat.retreatType === "online" && gift.status === "purchased" ? (
                          <p className="text-muted-foreground mt-1 text-xs">
                            Reminders: {gift.liveReminder24hSentAt ? "24h sent" : "24h pending"} ·{" "}
                            {gift.liveReminder1hSentAt ? "1h sent" : "1h pending"}
                          </p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4">
                        <p>{gift.roomLabel || "Retreat place"}</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {gift.guestCount} {gift.guestCount === 1 ? "guest" : "guests"}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={badgeVariant(gift.status)}>
                          {gift.status.replaceAll("_", " ")}
                        </Badge>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {formatCurrency(gift.totalPaidPence - gift.refundedAmountPence)}
                        </p>
                      </td>
                      <td className="py-3 text-right">
                        {gift.cancellationRequest &&
                        ["requested", "failed"].includes(gift.cancellationRequest.status) ? (
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              disabled={actionLoading !== ""}
                              onClick={() =>
                                void runRetreatAction("gift-cancellation", () =>
                                  fetch(
                                    `/api/admin/retreats/gift-cancellations/${gift.cancellationRequest!.id}`,
                                    {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ action: "approve" }),
                                    }
                                  )
                                )
                              }
                            >
                              {gift.cancellationRequest.status === "failed"
                                ? "Retry refund"
                                : "Approve cancellation"}
                            </Button>
                            {gift.cancellationRequest.status === "requested" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={actionLoading !== ""}
                                onClick={() => {
                                  const reason = window.prompt("Reason for rejecting this request");
                                  if (!reason?.trim()) return;
                                  void runRetreatAction("gift-cancellation", () =>
                                    fetch(
                                      `/api/admin/retreats/gift-cancellations/${gift.cancellationRequest!.id}`,
                                      {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ action: "reject", reason }),
                                      }
                                    )
                                  );
                                }}
                              >
                                Reject
                              </Button>
                            ) : null}
                          </div>
                        ) : gift.status === "purchased" ? (
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={actionLoading !== ""}
                              onClick={() => {
                                const recipientEmail = window.prompt(
                                  "Correct recipient email",
                                  gift.recipientEmail
                                );
                                if (!recipientEmail || recipientEmail === gift.recipientEmail)
                                  return;
                                void runRetreatAction("gift-recipient", () =>
                                  fetch(
                                    `/api/admin/retreats/${retreat.id}/gifts/${gift.id}/recipient`,
                                    {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ recipientEmail }),
                                    }
                                  )
                                );
                              }}
                            >
                              Correct email
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={actionLoading !== ""}
                              onClick={() =>
                                void runRetreatAction("gift-recipient", () =>
                                  fetch(
                                    `/api/admin/retreats/${retreat.id}/gifts/${gift.id}/recipient`,
                                    {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ action: "resend" }),
                                    }
                                  )
                                )
                              }
                            >
                              Resend invite
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={actionLoading !== ""}
                              onClick={() => {
                                if (
                                  !window.confirm(
                                    "Cancel this unredeemed gift and submit the policy-based refund? This cannot be undone."
                                  )
                                ) {
                                  return;
                                }
                                void runRetreatAction("gift-refund", () =>
                                  fetch(
                                    `/api/admin/retreats/${retreat.id}/gifts/${gift.id}/refund`,
                                    {
                                      method: "POST",
                                    }
                                  )
                                );
                              }}
                            >
                              Refund gift
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">No action needed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cancellation requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {retreat.bookings.some((booking) => booking.cancellationRequests.length > 0) ? (
              retreat.bookings.flatMap((booking) =>
                booking.cancellationRequests.map((request) => (
                  <div key={request.id} className="rounded-lg border p-4 text-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{booking.purchaserName}</p>
                          <Badge variant={badgeVariant(request.status)}>
                            {request.status.replaceAll("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">{booking.purchaserEmail}</p>
                        <p className="mt-3">
                          Calculated refund: {formatCurrency(request.refundableAmountPence)}
                        </p>
                        {request.reason ? (
                          <p className="text-muted-foreground mt-2">
                            Customer note: {request.reason}
                          </p>
                        ) : null}
                        {request.adminDecisionReason ? (
                          <p className="text-muted-foreground mt-2">
                            Decision note: {request.adminDecisionReason}
                          </p>
                        ) : null}
                      </div>
                      {["requested", "failed"].includes(request.status) ? (
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                          <Button
                            type="button"
                            disabled={actionLoading !== ""}
                            onClick={() => void decideCancellation(request.id, "approve")}
                          >
                            {request.status === "failed" ? "Retry refund" : "Approve and refund"}
                          </Button>
                          {request.status === "requested" ? (
                            <Button
                              type="button"
                              variant="outline"
                              disabled={actionLoading !== ""}
                              onClick={() => void decideCancellation(request.id, "reject")}
                            >
                              Reject
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              )
            ) : (
              <p className="text-muted-foreground text-sm">No cancellation requests.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attendee roster</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="py-3 pr-4">Attendee</th>
                  <th className="py-3 pr-4">Purchaser</th>
                  {retreat.retreatType === "online" ? (
                    <th className="py-3 pr-4">Readiness</th>
                  ) : null}
                  <th className="py-3 pr-4">Room</th>
                  <th className="py-3 pr-4">Extras</th>
                  <th className="py-3 pr-4">Payment</th>
                  <th className="py-3 pr-4">Booked</th>
                </tr>
              </thead>
              <tbody>
                {retreat.bookings.map((booking) => (
                  <tr key={booking.id} className="border-border/50 border-b">
                    <td className="py-3 pr-4">
                      <p>{booking.attendeeName}</p>
                      <p className="text-muted-foreground mt-1 text-xs">{booking.attendeeEmail}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <p>{booking.purchaserName}</p>
                      <p className="text-muted-foreground mt-1 text-xs">{booking.purchaserEmail}</p>
                    </td>
                    {retreat.retreatType === "online" ? (
                      <td className="py-3 pr-4">
                        <div className="flex flex-col items-start gap-1">
                          <Badge variant={booking.setupComplete ? "default" : "secondary"}>
                            {booking.setupComplete ? "Ready" : "Setup needed"}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {booking.accountLinked ? "Account linked" : "Account not linked"}
                          </span>
                          {!booking.setupComplete && booking.setupMissing.length > 0 ? (
                            <span className="text-muted-foreground max-w-48 text-xs">
                              Missing: {booking.setupMissing.join(", ").replaceAll("_", " ")}
                            </span>
                          ) : null}
                          <span className="text-muted-foreground text-xs">
                            {booking.liveAccessEnabled
                              ? "Live access active"
                              : "Live access inactive"}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            Reminders: {booking.liveReminder24hSentAt ? "24h sent" : "24h pending"}{" "}
                            · {booking.liveReminder1hSentAt ? "1h sent" : "1h pending"}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={actionLoading !== ""}
                            onClick={() =>
                              void runRetreatAction("access-email", () =>
                                fetch(
                                  `/api/admin/retreats/${retreat.id}/bookings/${booking.id}/resend-access`,
                                  { method: "POST" }
                                )
                              )
                            }
                          >
                            Resend access email
                          </Button>
                        </div>
                      </td>
                    ) : null}
                    <td className="py-3 pr-4">
                      <p>{booking.roomType || "Shared"}</p>
                      {retreat.retreatType === "online" ? (
                        <p className="text-muted-foreground mt-1 text-xs">
                          {booking.attendeeCount || 1}{" "}
                          {(booking.attendeeCount || 1) === 1 ? "person" : "people"}
                        </p>
                      ) : (
                        <label className="mt-1 block">
                          <span className="sr-only">Assigned room for {booking.attendeeName}</span>
                          <select
                            className="border-input bg-background focus-visible:ring-ring min-h-9 rounded-md border px-2 text-xs focus-visible:ring-2 focus-visible:outline-none"
                            value={booking.roomUnitId || ""}
                            disabled={actionLoading !== ""}
                            onChange={(event) =>
                              void runRetreatAction("room", () =>
                                fetch(`/api/admin/retreats/${retreat.id}/room-assignments`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    bookingId: booking.id,
                                    roomUnitId: event.target.value || null,
                                  }),
                                })
                              )
                            }
                          >
                            <option value="">Not assigned</option>
                            {retreat.roomUnits
                              .filter(
                                (unit) =>
                                  unit.roomOptionId === booking.roomOptionId ||
                                  (booking.inventoryPoolId &&
                                    unit.inventoryPoolId === booking.inventoryPoolId)
                              )
                              .map((unit) => (
                                <option
                                  key={unit.id}
                                  value={unit.id}
                                  disabled={
                                    unit.id !== booking.roomUnitId &&
                                    unit.occupiedUnits >= unit.capacityUnits
                                  }
                                >
                                  {unit.label} ({unit.occupiedUnits}/{unit.capacityUnits})
                                </option>
                              ))}
                          </select>
                        </label>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {booking.addons.length > 0 ? (
                        booking.addons.map((addon) => (
                          <p key={addon.id}>
                            {addon.name} × {addon.quantity}
                          </p>
                        ))
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-col gap-1">
                        <Badge variant={badgeVariant(booking.paymentStatus)}>
                          {booking.paymentStatus.replaceAll("_", " ")}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {formatCurrency(booking.depositPaidPence + booking.balancePaidPence)} of{" "}
                          {formatCurrency(booking.totalPricePence)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      {new Intl.DateTimeFormat("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(booking.bookedAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
