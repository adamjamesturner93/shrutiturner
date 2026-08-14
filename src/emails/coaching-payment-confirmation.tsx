import { Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, buttonStyle, colors, headingStyle, mutedTextStyle } from "./styles";

interface CoachingPaymentConfirmationEmailProps {
  firstName: string;
  tierLabel: string;
  amountLabel: string;
  invoiceUrl?: string | null;
  dashboardUrl: string;
}

export default function CoachingPaymentConfirmationEmail({
  firstName,
  tierLabel,
  amountLabel,
  invoiceUrl,
  dashboardUrl,
}: CoachingPaymentConfirmationEmailProps) {
  return (
    <EmailLayout preview={`Your ${tierLabel} payment is confirmed`}>
      <Text style={headingStyle}>Your coaching payment is confirmed</Text>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Your {amountLabel} payment for {tierLabel} has been received. Your coaching dashboard now
        shows the next onboarding step.
      </Text>
      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "24px",
          margin: "20px 0",
        }}
      >
        <Text style={mutedTextStyle}>
          Shruti will complete your manual Everfit setup and let you know when it is ready.
        </Text>
      </Section>
      <Section style={{ textAlign: "center" }}>
        {invoiceUrl ? (
          <Link href={invoiceUrl} style={buttonStyle}>
            View Stripe invoice
          </Link>
        ) : (
          <Link href={dashboardUrl} style={buttonStyle}>
            Open coaching dashboard
          </Link>
        )}
      </Section>
      {invoiceUrl ? (
        <Text style={{ ...mutedTextStyle, textAlign: "center" }}>
          You can also review your coaching status from your dashboard: {dashboardUrl}
        </Text>
      ) : null}
    </EmailLayout>
  );
}
