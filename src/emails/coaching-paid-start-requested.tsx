import { Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, buttonStyle, colors, headingStyle, mutedTextStyle } from "./styles";

interface CoachingPaidStartRequestedEmailProps {
  firstName: string;
  offerLabel: string;
  billingStartsOn: string;
  dashboardUrl: string;
  note?: string | null;
}

export default function CoachingPaidStartRequestedEmail({
  firstName,
  offerLabel,
  billingStartsOn,
  dashboardUrl,
  note,
}: CoachingPaidStartRequestedEmailProps) {
  return (
    <EmailLayout preview={`Set up your paid ${offerLabel} plan`}>
      <Text style={headingStyle}>Set up your paid 1:1 plan</Text>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Shruti has invited you to move from your pro-bono arrangement onto the paid {offerLabel}
        plan from {billingStartsOn}.
      </Text>
      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "24px",
          margin: "20px 0",
        }}
      >
        <Text style={bodyTextStyle}>What happens next:</Text>
        <Text style={mutedTextStyle}>
          1. Sign in and review the paid plan and current agreements.
        </Text>
        <Text style={mutedTextStyle}>2. Add your payment details securely through Stripe.</Text>
        <Text style={mutedTextStyle}>
          3. Your pro-bono arrangement remains in place and you will not be charged before{" "}
          {billingStartsOn}.
        </Text>
      </Section>
      {note ? (
        <Section
          style={{
            backgroundColor: colors.secondaryBg,
            borderRadius: "8px",
            padding: "24px",
            margin: "20px 0",
          }}
        >
          <Text style={bodyTextStyle}>A note from Shruti:</Text>
          <Text style={mutedTextStyle}>{note}</Text>
        </Section>
      ) : null}
      <Section style={{ textAlign: "center" }}>
        <Link href={dashboardUrl} style={buttonStyle}>
          Set up paid plan
        </Link>
      </Section>
    </EmailLayout>
  );
}
