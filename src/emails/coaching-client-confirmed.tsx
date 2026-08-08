import { Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, buttonStyle, colors, headingStyle, mutedTextStyle } from "./styles";

interface CoachingClientConfirmedEmailProps {
  firstName: string;
  tierLabel: string;
  dashboardUrl: string;
  decisionReason?: string | null;
}

export default function CoachingClientConfirmedEmail({
  firstName,
  tierLabel,
  dashboardUrl,
  decisionReason,
}: CoachingClientConfirmedEmailProps) {
  return (
    <EmailLayout preview="Your 1:1 support is confirmed">
      <Text style={headingStyle}>Your 1:1 support is confirmed</Text>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Your application for {tierLabel} has been accepted and your client profile is ready. There
        is no payment step for this arrangement.
      </Text>
      {decisionReason ? (
        <Section
          style={{
            backgroundColor: colors.secondaryBg,
            borderRadius: "8px",
            padding: "24px",
            margin: "20px 0",
          }}
        >
          <Text style={bodyTextStyle}>A note from Shruti:</Text>
          <Text style={mutedTextStyle}>{decisionReason}</Text>
        </Section>
      ) : null}
      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "24px",
          margin: "20px 0",
        }}
      >
        <Text style={bodyTextStyle}>What happens next:</Text>
        <Text style={mutedTextStyle}>1. Sign in to your account.</Text>
        <Text style={mutedTextStyle}>2. Shruti will set up the agreed support in Everfit.</Text>
        <Text style={mutedTextStyle}>
          3. You can follow your onboarding status from your dashboard.
        </Text>
      </Section>
      <Section style={{ textAlign: "center" }}>
        <Link href={dashboardUrl} style={buttonStyle}>
          Open your 1:1 dashboard
        </Link>
      </Section>
    </EmailLayout>
  );
}
