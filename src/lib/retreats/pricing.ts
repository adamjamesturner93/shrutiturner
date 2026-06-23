import type { RetreatPaymentPlanContent } from "@/lib/content/types";

export const PAY_IN_FULL_DISCOUNT_PERCENT = 5;
export const PAY_IN_FULL_DISCOUNT_CAP_PENCE = 5000;
export const IN_PERSON_REFUND_CUTOFF_DAYS = 56;
export const ONLINE_REFUND_CUTOFF_DAYS = 14;

export type RetreatType = "in_person" | "online";

export type RetreatInstalmentDraft = {
  sequence: number;
  kind: "deposit" | "scheduled" | "balance" | "full_payment";
  label: string;
  amountPence: number;
  dueAt?: Date;
};

export function calculatePayInFullDiscount(totalPence: number, enabled: boolean) {
  if (!enabled || totalPence <= 0) return 0;
  const percentageDiscount = Math.floor((totalPence * PAY_IN_FULL_DISCOUNT_PERCENT) / 100);
  return Math.min(percentageDiscount, PAY_IN_FULL_DISCOUNT_CAP_PENCE);
}

export function calculateOnlineNonRefundableAmount(totalPence: number) {
  return Math.max(1000, Math.ceil(totalPence * 0.1));
}

export function calculateRetreatNonRefundableAmount(input: {
  retreatType: RetreatType;
  totalPence: number;
  depositPence: number;
}) {
  if (input.retreatType === "online") {
    return calculateOnlineNonRefundableAmount(input.totalPence);
  }

  return Math.max(0, input.depositPence);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function subtractDays(date: Date, days: number) {
  return addDays(date, -days);
}

function roundPercentageAmount(totalPence: number, percent: number) {
  return Math.round((totalPence * percent) / 100);
}

function dueAtFromPlan(startDate: Date, dueDate?: string, dueDaysBeforeStart?: number) {
  if (dueDate) {
    const parsed = new Date(dueDate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (typeof dueDaysBeforeStart === "number" && Number.isFinite(dueDaysBeforeStart)) {
    return subtractDays(startDate, dueDaysBeforeStart);
  }
  return undefined;
}

export function buildRetreatInstalmentPlan(input: {
  totalPence: number;
  depositPence: number;
  startsAt: Date;
  paymentPlan?: RetreatPaymentPlanContent;
  payInFull?: boolean;
}) {
  const totalPence = Math.max(0, input.totalPence);

  if (input.payInFull) {
    return [
      {
        sequence: 1,
        kind: "full_payment",
        label: "Pay in full",
        amountPence: totalPence,
      } satisfies RetreatInstalmentDraft,
    ];
  }

  const planInstalments = input.paymentPlan?.instalments ?? [];
  if (planInstalments.length > 0) {
    const explicitPercentTotal = planInstalments.reduce(
      (sum, instalment) => sum + (instalment.percent ?? 0),
      0
    );
    if (explicitPercentTotal > 0 && Math.round(explicitPercentTotal) !== 100) {
      throw new Error("Retreat payment plan percentages must add up to 100.");
    }

    let allocated = 0;
    return planInstalments.map((instalment, index) => {
      const isLast = index === planInstalments.length - 1;
      const calculatedAmount =
        typeof instalment.amountPence === "number"
          ? instalment.amountPence
          : isLast
            ? totalPence - allocated
            : roundPercentageAmount(totalPence, instalment.percent ?? 0);
      allocated += calculatedAmount;

      return {
        sequence: index + 1,
        kind: instalment.kind ?? (index === 0 ? "deposit" : isLast ? "balance" : "scheduled"),
        label: instalment.label,
        amountPence: Math.max(0, calculatedAmount),
        dueAt: dueAtFromPlan(input.startsAt, instalment.dueDate, instalment.dueDaysBeforeStart),
      } satisfies RetreatInstalmentDraft;
    });
  }

  const depositPence = Math.min(Math.max(0, input.depositPence), totalPence);
  const balancePence = totalPence - depositPence;
  return [
    {
      sequence: 1,
      kind: "deposit",
      label: "Deposit",
      amountPence: depositPence,
    } satisfies RetreatInstalmentDraft,
    ...(balancePence > 0
      ? [
          {
            sequence: 2,
            kind: "balance",
            label: "Balance",
            amountPence: balancePence,
          } satisfies RetreatInstalmentDraft,
        ]
      : []),
  ];
}

export function calculateRetreatRefund(input: {
  actualPaidPence: number;
  nonRefundableAmountPence: number;
  startsAt: Date;
  requestedAt: Date;
  retreatType: RetreatType;
}) {
  const cutoffDays =
    input.retreatType === "online" ? ONLINE_REFUND_CUTOFF_DAYS : IN_PERSON_REFUND_CUTOFF_DAYS;
  const cutoffDate = subtractDays(input.startsAt, cutoffDays);
  if (input.requestedAt >= cutoffDate) {
    return 0;
  }

  return Math.max(0, input.actualPaidPence - input.nonRefundableAmountPence);
}
