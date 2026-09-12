"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/client";
import { parsePoundsToPence } from "@/lib/billing/money-input";

type Payment = {
  membershipId: string;
  label: string;
  invoiceId: string;
  paidPence: number;
  refundablePence: number;
};
const money = (pence: number) => `£${(pence / 100).toFixed(2)}`;

export function MembershipRefund() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selected, setSelected] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [asCredit, setAsCredit] = useState(false);
  const [credits, setCredits] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [working, setWorking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reload, setReload] = useState(0);
  const requestKey = useRef<string | null>(null);
  const payment = payments.find((item) => item.membershipId === selected);
  const pence = parsePoundsToPence(amount);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    void fetch("/api/admin/billing/refunds", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok)
          throw new Error(getApiErrorMessage(payload, "Unable to load refundable payments."));
        if (!controller.signal.aborted) setPayments(payload.data);
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted)
          setError(failure instanceof Error ? failure.message : "Unable to load payments.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reload]);

  async function submit() {
    if (working || !payment || !pence) return;
    setWorking(true);
    setAttempted(true);
    setError("");
    requestKey.current ||= crypto.randomUUID();
    try {
      const response = await fetch("/api/admin/billing/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId: payment.membershipId,
          expectedInvoiceId: payment.invoiceId,
          idempotencyKey: requestKey.current,
          amountPence: pence,
          reason,
          refundAsCredit: asCredit,
          creditAmount: asCredit ? Number(credits) : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          getApiErrorMessage(
            payload,
            "Outcome not confirmed. Retry this request; do not create another refund."
          )
        );
      setMessage(
        payload.data.status === "failed"
          ? "The provider marked this refund as failed. Check Stripe before starting another request."
          : payload.data.status === "pending"
            ? "Refund recorded; provider confirmation is pending."
            : "Refund recorded successfully."
      );
      setReviewing(false);
      setAttempted(false);
      setSelected("");
      setAmount("");
      setReason("");
      setAsCredit(false);
      setCredits("");
      requestKey.current = null;
      setReload((value) => value + 1);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Outcome not confirmed. Retry this request."
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="space-y-3 rounded-lg border p-4" aria-labelledby="membership-refund-title">
      <h3 id="membership-refund-title" className="font-medium">
        Membership refund
      </h3>
      <p className="text-muted-foreground text-sm">
        Latest paid invoice for each of the 100 most recently updated memberships. Pending refunds
        reduce the available amount.
      </p>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {loading ? (
        <p role="status">Loading payments…</p>
      ) : (
        <>
          <fieldset disabled={reviewing || working} className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 md:col-span-2">
              <span>Payment</span>
              <select
                className="bg-background w-full rounded-md border p-2"
                value={selected}
                onChange={(event) => setSelected(event.target.value)}
              >
                <option value="">Select a membership payment</option>
                {payments.map((item) => (
                  <option
                    key={item.membershipId}
                    value={item.membershipId}
                    disabled={!item.refundablePence}
                  >
                    {item.label} · {item.invoiceId} · {money(item.refundablePence)} available
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span>Refund amount (£)</span>
              <Input
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span>Reason</span>
              <Input value={reason} onChange={(event) => setReason(event.target.value)} />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={asCredit}
                onChange={(event) => setAsCredit(event.target.checked)}
              />
              Issue class credits instead
            </label>
            {asCredit && (
              <label className="space-y-1">
                <span>Number of credits</span>
                <Input
                  inputMode="numeric"
                  value={credits}
                  onChange={(event) => setCredits(event.target.value)}
                />
              </label>
            )}
          </fieldset>
          {reviewing && payment && pence ? (
            <div className="space-y-2 rounded-md border p-3" role="status">
              <p>
                {asCredit
                  ? `Issue ${credits} class credits instead of refunding ${money(pence)}`
                  : `Refund ${money(pence)} to the original payment method`}{" "}
                for {payment.label}?
              </p>
              <p className="text-sm">
                Invoice {payment.invoiceId} · {money(payment.paidPence)} paid ·{" "}
                {money(payment.refundablePence)} available. Capacity is checked again when you
                confirm.
              </p>
              <Button disabled={working} onClick={() => void submit()}>
                {working ? "Recording…" : attempted ? "Retry same request" : "Confirm refund"}
              </Button>
              {!attempted && (
                <Button variant="outline" onClick={() => setReviewing(false)}>
                  Edit
                </Button>
              )}
              {attempted && (
                <p className="text-sm">
                  Keep this page open to retry safely. If the outcome remains unclear, reconcile
                  this invoice in Stripe before making another request.
                </p>
              )}
            </div>
          ) : (
            <Button
              disabled={
                !payment ||
                !pence ||
                pence > payment.refundablePence ||
                !reason.trim() ||
                (asCredit && (!/^\d+$/.test(credits) || Number(credits) <= 0))
              }
              onClick={() => {
                setError("");
                setMessage("");
                setReviewing(true);
              }}
            >
              Review refund
            </Button>
          )}
          {!payments.length && (
            <Button
              variant="outline"
              onClick={() => {
                setError("");
                setReload((value) => value + 1);
              }}
            >
              Reload payments
            </Button>
          )}
        </>
      )}
    </section>
  );
}
