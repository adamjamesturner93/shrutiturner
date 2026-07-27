export type RetreatType = "in_person" | "online";
export type RetreatBookingUnitCode =
  | "bed_space"
  | "whole_room"
  | "ticket"
  | "addon"
  | "online_live_place";

export type RetreatDepositRuleInput =
  | {
      depositType: "percentage";
      depositPercentageBasisPoints: number;
      fixedDepositAmountPence?: null;
    }
  | {
      depositType: "fixed_amount";
      fixedDepositAmountPence: number;
      depositPercentageBasisPoints?: null;
    }
  | {
      depositType: "full_payment";
      depositPercentageBasisPoints?: null;
      fixedDepositAmountPence?: null;
    };

export type RetreatRatePlanInput = {
  id?: string;
  guestCount: number;
  totalPricePence: number;
  earlyBirdPricePence?: number | null;
  earlyBirdEndsAt?: Date | string | null;
  currency?: string;
  active?: boolean;
};

export type RetreatAccommodationSelectionInput = {
  bookingUnit: RetreatBookingUnitCode;
  quantity: number;
  guestCount: number;
  allowedGuestCounts?: number[];
  guestCountPerUnit?: number | null;
  ratePlans: RetreatRatePlanInput[];
  depositRule: RetreatDepositRuleInput;
  currency?: string;
  now?: Date;
};

export type RetreatAccommodationQuote = {
  ratePlanId?: string;
  bookingUnit: RetreatBookingUnitCode;
  quantity: number;
  guestCount: number;
  inventoryUnitsConsumed: number;
  totalGuestCount: number;
  unitPricePence: number;
  totalPricePence: number;
  depositPence: number;
  balancePence: number;
  currency: string;
};

export type RetreatPaymentPlan = {
  instalments: Array<{
    label: string;
    kind?: "deposit" | "scheduled" | "balance" | "full_payment";
    amountPence?: number;
    percent?: number;
    dueDate?: string;
    dueDaysBeforeStart?: number;
  }>;
};

export type RetreatInstalmentDraft = {
  sequence: number;
  kind: "deposit" | "scheduled" | "balance" | "full_payment";
  label: string;
  amountPence: number;
  dueAt: Date | null;
};

export function canExtendPublishedEarlyBirdRate(input: {
  existingPricePence: number | null;
  existingEndsAt: Date | null;
  submittedPricePence: number | null;
  submittedEndsAt: Date | null;
  retreatStartsAt: Date;
}) {
  if (input.submittedPricePence !== input.existingPricePence) return false;

  if (input.existingPricePence === null) {
    return input.submittedEndsAt === null;
  }

  if (!input.existingEndsAt || !input.submittedEndsAt) return false;

  return (
    input.submittedEndsAt.getTime() >= input.existingEndsAt.getTime() &&
    input.submittedEndsAt.getTime() < input.retreatStartsAt.getTime()
  );
}

const DEFAULT_PAY_IN_FULL_DISCOUNT_PERCENT = 5;
const DEFAULT_PAY_IN_FULL_DISCOUNT_CAP_PENCE = 5000;
const DEFAULT_ONLINE_REFUND_CUTOFF_DAYS = 14;
const DEFAULT_IN_PERSON_REFUND_CUTOFF_DAYS = 56;

export function calculatePercentageDeposit(totalPence: number, basisPoints: number) {
  if (totalPence <= 0 || basisPoints <= 0) return 0;
  return Math.min(totalPence, Math.round((totalPence * basisPoints) / 10000));
}

export function calculateDepositFromRule(totalPence: number, rule: RetreatDepositRuleInput) {
  const safeTotal = Math.max(totalPence, 0);
  if (rule.depositType === "full_payment") return safeTotal;
  if (rule.depositType === "fixed_amount") {
    return Math.min(safeTotal, Math.max(rule.fixedDepositAmountPence, 0));
  }
  return calculatePercentageDeposit(safeTotal, rule.depositPercentageBasisPoints);
}

export function getInventoryUnitsConsumed(input: {
  bookingUnit: RetreatBookingUnitCode;
  quantity: number;
}) {
  const quantity = Math.max(Math.trunc(input.quantity), 0);
  if (input.bookingUnit === "whole_room") return quantity;
  if (input.bookingUnit === "bed_space") return quantity;
  if (input.bookingUnit === "ticket") return quantity;
  if (input.bookingUnit === "online_live_place") return quantity;
  if (input.bookingUnit === "addon") return quantity;
  return quantity;
}

export function getTotalGuestsForSelection(input: {
  bookingUnit: RetreatBookingUnitCode;
  quantity: number;
  guestCount: number;
  guestCountPerUnit?: number | null;
}) {
  const quantity = Math.max(Math.trunc(input.quantity), 0);
  const guestCount = Math.max(Math.trunc(input.guestCount), 0);
  if (input.bookingUnit === "bed_space") {
    return quantity * Math.max(Math.trunc(input.guestCountPerUnit ?? 1), 1);
  }
  return quantity * guestCount;
}

export function selectRetreatRatePlan(input: {
  guestCount: number;
  ratePlans: RetreatRatePlanInput[];
}) {
  const activePlans = input.ratePlans.filter((ratePlan) => ratePlan.active !== false);
  return activePlans.find((ratePlan) => ratePlan.guestCount === input.guestCount) || null;
}

export function isRetreatEarlyBirdActive(input: {
  earlyBirdPricePence?: number | null;
  earlyBirdEndsAt?: Date | string | null;
  totalPricePence: number;
  now?: Date;
}) {
  if (
    typeof input.earlyBirdPricePence !== "number" ||
    input.earlyBirdPricePence < 0 ||
    input.earlyBirdPricePence >= input.totalPricePence ||
    !input.earlyBirdEndsAt
  ) {
    return false;
  }

  const endDate =
    input.earlyBirdEndsAt instanceof Date ? input.earlyBirdEndsAt : new Date(input.earlyBirdEndsAt);
  if (Number.isNaN(endDate.getTime())) return false;
  return (input.now || new Date()).getTime() < endDate.getTime();
}

export function getEffectiveRetreatRatePricePence(
  ratePlan: RetreatRatePlanInput,
  now: Date = new Date()
) {
  if (
    isRetreatEarlyBirdActive({
      earlyBirdPricePence: ratePlan.earlyBirdPricePence,
      earlyBirdEndsAt: ratePlan.earlyBirdEndsAt,
      totalPricePence: ratePlan.totalPricePence,
      now,
    })
  ) {
    return Math.max(Math.trunc(ratePlan.earlyBirdPricePence || 0), 0);
  }

  return Math.max(Math.trunc(ratePlan.totalPricePence), 0);
}

export function quoteRetreatAccommodation(
  input: RetreatAccommodationSelectionInput
): RetreatAccommodationQuote {
  const quantity = Math.max(Math.trunc(input.quantity), 0);
  const guestCount = Math.max(Math.trunc(input.guestCount), 0);
  if (quantity <= 0) throw new Error("RETREAT_QUANTITY_REQUIRED");

  if (input.bookingUnit === "bed_space") {
    const guestCountPerUnit = Math.max(Math.trunc(input.guestCountPerUnit ?? 1), 1);
    if (guestCount !== guestCountPerUnit) {
      throw new Error("RETREAT_GUEST_COUNT_INVALID");
    }
  }

  if (input.allowedGuestCounts?.length && !input.allowedGuestCounts.includes(guestCount)) {
    throw new Error("RETREAT_GUEST_COUNT_INVALID");
  }

  const ratePlan = selectRetreatRatePlan({ guestCount, ratePlans: input.ratePlans });
  if (!ratePlan) throw new Error("RETREAT_RATE_PLAN_NOT_FOUND");

  const unitPricePence = getEffectiveRetreatRatePricePence(ratePlan, input.now || new Date());
  const totalPricePence = unitPricePence * quantity;
  const depositPence = calculateDepositFromRule(totalPricePence, input.depositRule);
  return {
    ratePlanId: ratePlan.id,
    bookingUnit: input.bookingUnit,
    quantity,
    guestCount,
    inventoryUnitsConsumed: getInventoryUnitsConsumed({
      bookingUnit: input.bookingUnit,
      quantity,
    }),
    totalGuestCount: getTotalGuestsForSelection({
      bookingUnit: input.bookingUnit,
      quantity,
      guestCount,
      guestCountPerUnit: input.guestCountPerUnit,
    }),
    unitPricePence,
    totalPricePence,
    depositPence,
    balancePence: Math.max(totalPricePence - depositPence, 0),
    currency: ratePlan.currency || input.currency || "GBP",
  };
}

export function getRemainingInventory(input: {
  totalQuantity: number;
  confirmedQuantity: number;
  heldQuantity: number;
}) {
  return Math.max(
    Math.trunc(input.totalQuantity) -
      Math.max(Math.trunc(input.confirmedQuantity), 0) -
      Math.max(Math.trunc(input.heldQuantity), 0),
    0
  );
}

export function calculatePayInFullDiscount(
  totalPence: number,
  enabled: boolean,
  percent = DEFAULT_PAY_IN_FULL_DISCOUNT_PERCENT,
  capPence = DEFAULT_PAY_IN_FULL_DISCOUNT_CAP_PENCE
) {
  if (!enabled || totalPence <= 0) return 0;
  const percentageDiscount = Math.floor((totalPence * Math.max(percent, 0)) / 100);
  return Math.min(percentageDiscount, Math.max(capPence, 0), totalPence);
}

export function calculateOnlineNonRefundableAmount(totalPence: number) {
  if (totalPence <= 0) return 0;
  return Math.min(totalPence, Math.max(1000, Math.ceil(totalPence * 0.1)));
}

export function calculateRetreatNonRefundableAmount(input: {
  retreatType: RetreatType;
  totalPence: number;
  depositPence: number;
}) {
  if (input.retreatType === "online") {
    return calculateOnlineNonRefundableAmount(input.totalPence);
  }
  return Math.min(Math.max(input.depositPence, 0), Math.max(input.totalPence, 0));
}

function getDueDate(startsAt: Date, dueDate?: string, dueDaysBeforeStart?: number) {
  if (dueDate) {
    const parsed = new Date(dueDate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (typeof dueDaysBeforeStart === "number") {
    return new Date(startsAt.getTime() - dueDaysBeforeStart * 86400000);
  }
  return null;
}

export function buildRetreatInstalmentPlan(input: {
  totalPence: number;
  depositPence: number;
  startsAt: Date;
  paymentPlan?: RetreatPaymentPlan | null;
  payInFull?: boolean;
}): RetreatInstalmentDraft[] {
  const totalPence = Math.max(input.totalPence, 0);
  if (input.payInFull) {
    return [
      {
        sequence: 1,
        kind: "full_payment",
        label: "Payment in full",
        amountPence: totalPence,
        dueAt: null,
      },
    ];
  }

  const configured = input.paymentPlan?.instalments?.filter(
    (instalment) =>
      typeof instalment.amountPence === "number" || typeof instalment.percent === "number"
  );
  if (configured?.length) {
    let allocated = 0;
    return configured.map((instalment, index) => {
      const isLast = index === configured.length - 1;
      const amountFromPercent =
        typeof instalment.percent === "number"
          ? Math.round((totalPence * instalment.percent) / 100)
          : undefined;
      const amountPence = isLast
        ? Math.max(totalPence - allocated, 0)
        : Math.max(instalment.amountPence ?? amountFromPercent ?? 0, 0);
      allocated += amountPence;
      return {
        sequence: index + 1,
        kind: instalment.kind || (index === 0 ? "deposit" : "scheduled"),
        label: instalment.label || (index === 0 ? "Deposit" : `Payment ${index + 1}`),
        amountPence,
        dueAt: getDueDate(input.startsAt, instalment.dueDate, instalment.dueDaysBeforeStart),
      };
    });
  }

  const depositPence = Math.min(Math.max(input.depositPence, 0), totalPence);
  const balancePence = Math.max(totalPence - depositPence, 0);
  return [
    {
      sequence: 1,
      kind: balancePence > 0 ? "deposit" : "full_payment",
      label: balancePence > 0 ? "Deposit" : "Payment in full",
      amountPence: depositPence || totalPence,
      dueAt: null,
    },
    ...(balancePence > 0
      ? [
          {
            sequence: 2,
            kind: "balance" as const,
            label: "Balance",
            amountPence: balancePence,
            dueAt: getDueDate(input.startsAt, undefined, DEFAULT_IN_PERSON_REFUND_CUTOFF_DAYS),
          },
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
    input.retreatType === "online"
      ? DEFAULT_ONLINE_REFUND_CUTOFF_DAYS
      : DEFAULT_IN_PERSON_REFUND_CUTOFF_DAYS;
  const cutoffAt = new Date(input.startsAt.getTime() - cutoffDays * 86400000);
  if (input.requestedAt >= cutoffAt) return 0;
  return Math.max(input.actualPaidPence - input.nonRefundableAmountPence, 0);
}
