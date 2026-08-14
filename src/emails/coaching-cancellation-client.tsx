import { Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, buttonStyle, colors, headingStyle, mutedTextStyle } from "./styles";

interface CoachingCancellationClientEmailProps {
  firstName: string;
  finalPaymentAt?: string | null;
  endsAt: string;
  dashboardUrl: string;
}

export default function CoachingCancellationClientEmail({
  firstName,
  finalPaymentAt,
  endsAt,
  dashboardUrl,
}: CoachingCancellationClientEmailProps) {
  return (
    <EmailLayout preview="Your coaching cancellation is scheduled">
      <Text style={headingStyle}>Your coaching cancellation is scheduled</Text>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        {finalPaymentAt
          ? `Your payment on ${finalPaymentAt} will be your final coaching payment.`
          : "No further coaching payments will be collected."}
      </Text>
      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "24px",
          margin: "20px 0",
        }}
      >
        <Text style={mutedTextStyle}>Your coaching access continues until {endsAt}.</Text>
      </Section>
      <Section style={{ textAlign: "center" }}>
        <Link href={dashboardUrl} style={buttonStyle}>
          Review coaching status
        </Link>
      </Section>
    </EmailLayout>
  );
}
