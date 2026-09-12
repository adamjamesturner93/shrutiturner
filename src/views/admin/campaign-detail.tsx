"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "../../components/admin-layout";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { AlertTriangle, ArrowLeft, Info } from "lucide-react";
import type { AdminNewsletterCampaignDetailDto } from "@/lib/api/types";
import { InlineLoadingStatus } from "@/components/loading-region";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [action, setAction] = useState<"retry" | "confirm_delivered" | "confirm_not_sent" | null>(
    null
  );
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<string[]>([]);
  const [reconciliationNote, setReconciliationNote] = useState("");
  const [confirmation, setConfirmation] = useState<"confirm_delivered" | "confirm_not_sent" | null>(
    null
  );
  const [confirmationError, setConfirmationError] = useState("");
  const [loadError, setLoadError] = useState("");

  const loadCampaign = useCallback(async () => {
    setLoadError("");
    try {
      const response = await fetch(`/api/admin/newsletter/${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Campaign details could not be loaded. Please retry.");
      }
      setCampaign((await response.json()) as AdminNewsletterCampaignDetailDto);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Campaign details could not be loaded."
      );
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    void loadCampaign().finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [loadCampaign]);

  async function runAction(nextAction: "retry" | "confirm_delivered" | "confirm_not_sent") {
    if (action || loadError) return;
    setConfirmationError("");
    setAction(nextAction);
    setActionMessage(null);
    try {
      const endpoint =
        nextAction === "retry"
          ? `/api/admin/newsletter/campaigns/${encodeURIComponent(id)}/retry`
          : `/api/admin/newsletter/campaigns/${encodeURIComponent(id)}/reconcile`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body:
          nextAction === "retry"
            ? undefined
            : JSON.stringify({
                resolution: nextAction,
                note: reconciliationNote,
                deliveries: campaign?.ambiguousDeliveries
                  .filter((row) => selectedDeliveryIds.includes(row.id))
                  .map(({ id, attemptCount }) => ({ id, attemptCount })),
              }),
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "The campaign could not be updated");
      setConfirmation(null);
      setActionMessage(
        nextAction === "retry"
          ? "Eligible failed messages were retried."
          : nextAction === "confirm_delivered"
            ? "Selected messages were recorded as sent by the provider."
            : "Unknown messages were marked as not sent. Review the failed count before retrying."
      );
      await loadCampaign();
      setSelectedDeliveryIds([]);
      setReconciliationNote("");
    } catch (error) {
      if (nextAction !== "retry")
        setConfirmationError(
          error instanceof Error ? error.message : "The campaign could not be updated"
        );
      setActionMessage(
        error instanceof Error ? error.message : "The campaign could not be updated"
      );
    } finally {
      setAction(null);
    }
  }

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
        {loadError ? (
          <div role="alert" className="rounded-lg border p-4">
            <p>{loadError}</p>
            <Button variant="outline" className="mt-2" onClick={() => void loadCampaign()}>
              Retry loading campaign
            </Button>
          </div>
        ) : null}
        {!loading && !loadError && !campaign ? (
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
                  {campaign.canReconcile ? (
                    <div className="space-y-3 rounded-lg border border-red-300 bg-white/70 p-4">
                      <div>
                        <p className="font-medium text-red-950">
                          {campaign.deliveryStateCounts.sending} recipient outcome
                          {campaign.deliveryStateCounts.sending === 1 ? " is" : "s are"} unknown
                        </p>
                        <p className="mt-1 text-sm text-red-900">
                          Check this campaign in Postmark before choosing an outcome. Do not retry
                          until every unknown message has been reconciled.
                        </p>
                      </div>
                      <fieldset className="space-y-2">
                        <legend className="text-sm font-medium">
                          Select recipients whose outcome you have verified
                        </legend>
                        {(campaign.ambiguousDeliveries || []).map((delivery) => (
                          <label key={delivery.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selectedDeliveryIds.includes(delivery.id)}
                              onChange={(event) =>
                                setSelectedDeliveryIds((current) =>
                                  event.target.checked
                                    ? [...current, delivery.id]
                                    : current.filter((id) => id !== delivery.id)
                                )
                              }
                            />
                            {delivery.email} · attempt {delivery.attemptCount}
                          </label>
                        ))}
                        <label className="block text-sm">
                          Provider evidence / reference
                          <textarea
                            className="mt-1 w-full rounded border p-2"
                            maxLength={2000}
                            value={reconciliationNote}
                            onChange={(event) => setReconciliationNote(event.target.value)}
                          />
                        </label>
                      </fieldset>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setConfirmationError("");
                            setConfirmation("confirm_delivered");
                          }}
                          disabled={
                            Boolean(loadError) ||
                            action !== null ||
                            !selectedDeliveryIds.length ||
                            !reconciliationNote.trim()
                          }
                        >
                          {action === "confirm_delivered" ? "Saving…" : "Postmark shows sent"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setConfirmationError("");
                            setConfirmation("confirm_not_sent");
                          }}
                          disabled={
                            Boolean(loadError) ||
                            action !== null ||
                            !selectedDeliveryIds.length ||
                            !reconciliationNote.trim()
                          }
                        >
                          {action === "confirm_not_sent" ? "Saving…" : "Postmark shows not sent"}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  {!campaign.canReconcile && campaign.canRetry ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void runAction("retry")}
                      disabled={action !== null || Boolean(loadError)}
                    >
                      {action === "retry" ? "Retrying…" : "Retry eligible failed messages"}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
            {actionMessage ? (
              <p className="text-muted-foreground text-sm" role="status">
                {actionMessage}
              </p>
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
                <details className="text-muted-foreground text-sm">
                  <summary className="text-foreground cursor-pointer font-medium">
                    Processing states
                  </summary>
                  <p className="mt-2">
                    Queued {campaign.deliveryStateCounts.queued} · Sending/unknown{" "}
                    {campaign.deliveryStateCounts.sending} · Sent{" "}
                    {campaign.deliveryStateCounts.sent}
                    {" · "}Failed {campaign.deliveryStateCounts.failed} · No further retries{" "}
                    {campaign.deliveryStateCounts.deadLetter}
                  </p>
                </details>
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
      <Dialog
        open={Boolean(confirmation)}
        onOpenChange={(open) => {
          if (!open && !action) setConfirmation(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm outcome for {selectedDeliveryIds.length} selected recipients
            </DialogTitle>
            <DialogDescription>
              {confirmation === "confirm_not_sent"
                ? "Only confirm if provider evidence shows these messages were not sent. This makes them eligible for a separate retry. An incorrect confirmation can cause duplicate emails."
                : "Confirm that provider evidence shows these selected messages were sent. They will not be retried. This does not establish inbox delivery or that someone read the email."}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm whitespace-pre-wrap">
            <span className="font-medium">Evidence: </span>
            {reconciliationNote}
          </p>
          {confirmationError ? (
            <p role="alert" className="text-destructive text-sm">
              {confirmationError}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={Boolean(action)}
              onClick={() => setConfirmation(null)}
            >
              Keep reviewing
            </Button>
            <Button
              disabled={Boolean(action)}
              onClick={() => {
                if (confirmation) void runAction(confirmation);
              }}
            >
              {action ? "Saving…" : "Confirm selected outcomes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
