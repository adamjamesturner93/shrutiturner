import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, headingStyle, mutedTextStyle, buttonStyle, colors } from "./styles";

interface CoachingCancellationNotificationEmailProps {
  clientName: string;
  clientEmail: string;
  nextPaymentAt: string;
  endsAt: string;
  adminUrl: string;
}

export default function CoachingCancellationNotificationEmail({
  clientName,
  clientEmail,
  nextPaymentAt,
  endsAt,
  adminUrl,
}: CoachingCancellationNotificationEmailProps) {
  return (
    <EmailLayout preview={`1:1 cancellation scheduled for ${clientName}`}>
      <Text style={headingStyle}>1:1 cancellation scheduled</Text>
      <Text style={bodyTextStyle}>
        {clientName} has scheduled 1:1 cancellation. Their next payment is still due and will be
        their final 1:1 payment.
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
          <strong>Email:</strong> {clientEmail}
        </Text>
        <Text style={mutedTextStyle}>Final payment: {nextPaymentAt}</Text>
        <Text style={mutedTextStyle}>Billing/access end: {endsAt}</Text>
        <Text style={mutedTextStyle}>
          Plan the Everfit handover and access changes manually around these dates.
        </Text>
      </Section>
      <Section style={{ textAlign: "center" }}>
        <Link href={adminUrl} style={buttonStyle}>
          Open 1:1 admin
        </Link>
      </Section>
    </EmailLayout>
  );
}
