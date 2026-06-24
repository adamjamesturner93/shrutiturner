import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, headingStyle, mutedTextStyle, buttonStyle, colors } from "./styles";

interface CoachingPaymentNotificationEmailProps {
  clientName: string;
  clientEmail: string;
  tierLabel: string;
  adminUrl: string;
}

export default function CoachingPaymentNotificationEmail({
  clientName,
  clientEmail,
  tierLabel,
  adminUrl,
}: CoachingPaymentNotificationEmailProps) {
  return (
    <EmailLayout preview={`1:1 payment received from ${clientName}`}>
      <Text style={headingStyle}>1:1 payment received</Text>
      <Text style={bodyTextStyle}>
        {clientName} has completed payment for {tierLabel}. They are ready for manual Everfit setup.
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
        <Text style={mutedTextStyle}>
          Create or update the client in Everfit, then update their manual setup status in admin.
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
