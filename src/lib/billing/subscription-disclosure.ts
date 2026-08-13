export const SUBSCRIPTION_DISCLOSURE_VERSION = "2026-05-24";
export const TRIAL_REMINDER_LEAD_DAYS = 3;
export const ANNUAL_RENEWAL_REMINDER_LEAD_DAYS = [30, 7] as const;
export const MONTHLY_REMINDER_INTERVAL_MONTHS = 6;
export const MEMBERSHIP_TRIAL_DAYS = 14;
export const MOVEWELL_MONTHLY_PENCE = 3500;
export const MOVEWELL_ANNUAL_PENCE = 35000;

export type SubscriptionDisclosureInterval = "monthly" | "annual";

function formatMoney(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

function disclosurePrice(
  interval: SubscriptionDisclosureInterval,
  prices?: { monthlyPricePence?: number | null; annualPricePence?: number | null }
) {
  if (interval === "annual") return prices?.annualPricePence || MOVEWELL_ANNUAL_PENCE;
  return prices?.monthlyPricePence || MOVEWELL_MONTHLY_PENCE;
}

export function buildMembershipDisclosure(
  interval: SubscriptionDisclosureInterval,
  prices?: { monthlyPricePence?: number | null; annualPricePence?: number | null }
) {
  const pricePence = disclosurePrice(interval, prices);
  const intervalLabel = interval === "annual" ? "year" : "month";
  const minimumLiability =
    interval === "annual"
      ? `Nothing is charged during the ${MEMBERSHIP_TRIAL_DAYS}-day trial. If you do not cancel, ${formatMoney(pricePence)} becomes payable for the first annual term.`
      : `Nothing is charged during the ${MEMBERSHIP_TRIAL_DAYS}-day trial. If you do not cancel, ${formatMoney(pricePence)} becomes payable for the first monthly term.`;

  return {
    version: SUBSCRIPTION_DISCLOSURE_VERSION,
    title: "Move Well Membership",
    keyItems: [
      `Price: ${formatMoney(pricePence)} per ${intervalLabel}.`,
      "This membership renews automatically until you cancel.",
      `A ${MEMBERSHIP_TRIAL_DAYS}-day free trial applies before the first paid renewal.`,
      minimumLiability,
      "You can cancel online from your Membership dashboard. If you sign up online, you do not need to call or email to cancel.",
      "You have an initial 14-day cooling-off right from the day after signup. After a trial converts to paid and after annual renewals, you also receive a further 14-day renewal cooling-off right.",
      `Reminder notices are sent before the trial ends, 30 days and 7 days before annual renewals and every ${MONTHLY_REMINDER_INTERVAL_MONTHS} months for rolling monthly memberships.`,
    ],
    fullItems: [
      "Supplier: Shruti Turner.",
      "Contact: shruti@shrutiturner.co.uk.",
      "Payment processing: Stripe.",
      "Cancellation acknowledgement and end-of-contract details are sent by email on a durable medium.",
      "Terms & Conditions and Refund & Cancellation Policy apply alongside your statutory consumer rights.",
    ],
    acknowledgementLabel:
      "I understand the automatic renewal, trial, cancellation, reminderand cooling-off terms for this subscription.",
  };
}

export function getNoticeTimingSummary(interval: SubscriptionDisclosureInterval) {
  return interval === "annual"
    ? `Trial reminder before the ${MEMBERSHIP_TRIAL_DAYS}-day trial ends, annual renewal reminders 30 days and 7 days before the next termand a renewal cooling-off notice on the day an annual term starts.`
    : `Trial reminder before the ${MEMBERSHIP_TRIAL_DAYS}-day trial ends, rolling reminders every ${MONTHLY_REMINDER_INTERVAL_MONTHS} months and a renewal cooling-off notice if the trial converts into a paid monthly term.`;
}
