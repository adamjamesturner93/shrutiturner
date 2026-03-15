import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, headingStyle, mutedTextStyle, buttonStyle, colors } from "./styles";

interface RetreatBalanceDueEmailProps {
  firstName: string;
  retreatName: string;
  retreatDates: string;
  balanceAmount: string;
  dueDate: string;
  paymentUrl: string;
}

export default function RetreatBalanceDueEmail({
  firstName,
  retreatName,
  retreatDates,
  balanceAmount,
  dueDate,
  paymentUrl,
}: RetreatBalanceDueEmailProps) {
  return (
    <EmailLayout preview={`Retreat balance due for ${retreatName}`}>
      <Text style={headingStyle}>Your retreat balance is ready</Text>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Your place on {retreatName} is secured. The remaining balance can be paid any time before{" "}
        {dueDate}.
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
          <strong>Balance due:</strong> {balanceAmount}
        </Text>
        <Text style={mutedTextStyle}>Due by {dueDate}</Text>
      </Section>
      <Section style={{ textAlign: "center" }}>
        <Link href={paymentUrl} style={buttonStyle}>
          Pay remaining balance
        </Link>
      </Section>
    </EmailLayout>
  );
}
