import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, buttonStyle, colors, headingStyle, mutedTextStyle } from "./styles";

type RetreatCancellationEmailProps = {
  firstName: string;
  retreatName: string;
  retreatDates: string;
  status: "requested" | "approved" | "rejected";
  refundableAmount: string;
  dashboardUrl: string;
  reason?: string | null;
  decisionReason?: string | null;
};

export default function RetreatCancellationEmail({
  firstName,
  retreatName,
  retreatDates,
  status,
  refundableAmount,
  dashboardUrl,
  reason,
  decisionReason,
}: RetreatCancellationEmailProps) {
  const heading =
    status === "requested"
      ? "Your cancellation request has been received"
      : status === "approved"
        ? "Your retreat cancellation is complete"
        : "An update on your cancellation request";

  return (
    <EmailLayout preview={`${heading}: ${retreatName}`}>
      <Text style={headingStyle}>{heading}</Text>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      {status === "requested" ? (
        <Text style={bodyTextStyle}>
          Shruti has received your request and will review it against the cancellation terms that
          applied to your booking. No further action is needed from you while it is being reviewed.
        </Text>
      ) : status === "approved" ? (
        <Text style={bodyTextStyle}>
          Your booking has been cancelled. Any refund shown below has been submitted to the payment
          method used for the booking. Your bank may take several working days to display it.
        </Text>
      ) : (
        <Text style={bodyTextStyle}>
          Your booking remains active. The reason for this decision is shown below. Reply to this
          email if you need to discuss it with Shruti.
        </Text>
      )}
      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "24px",
          margin: "20px 0",
        }}
      >
        <Text style={bodyTextStyle}>
          <strong>Retreat:</strong> {retreatName}
        </Text>
        <Text style={bodyTextStyle}>
          <strong>Dates:</strong> {retreatDates}
        </Text>
        <Text style={bodyTextStyle}>
          <strong>Refund under the booking terms:</strong> {refundableAmount}
        </Text>
        {reason ? <Text style={mutedTextStyle}>Your note: {reason}</Text> : null}
        {decisionReason ? (
          <Text style={mutedTextStyle}>Decision note: {decisionReason}</Text>
        ) : null}
      </Section>
      <Section style={{ textAlign: "center" }}>
        <Link href={dashboardUrl} style={buttonStyle}>
          View booking
        </Link>
      </Section>
    </EmailLayout>
  );
}

export function RetreatCancellationAdminEmail({
  customerName,
  customerEmail,
  retreatName,
  retreatDates,
  refundableAmount,
  reason,
  adminUrl,
}: {
  customerName: string;
  customerEmail: string;
  retreatName: string;
  retreatDates: string;
  refundableAmount: string;
  reason?: string | null;
  adminUrl: string;
}) {
  return (
    <EmailLayout preview={`Cancellation request: ${retreatName}`}>
      <Text style={headingStyle}>A retreat cancellation needs review</Text>
      <Text style={bodyTextStyle}>
        {customerName} ({customerEmail}) has asked to cancel their booking.
      </Text>
      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "24px",
          margin: "20px 0",
        }}
      >
        <Text style={bodyTextStyle}>
          <strong>Retreat:</strong> {retreatName}
        </Text>
        <Text style={bodyTextStyle}>
          <strong>Dates:</strong> {retreatDates}
        </Text>
        <Text style={bodyTextStyle}>
          <strong>Calculated refund:</strong> {refundableAmount}
        </Text>
        {reason ? <Text style={mutedTextStyle}>Customer note: {reason}</Text> : null}
      </Section>
      <Section style={{ textAlign: "center" }}>
        <Link href={adminUrl} style={buttonStyle}>
          Review request
        </Link>
      </Section>
    </EmailLayout>
  );
}
