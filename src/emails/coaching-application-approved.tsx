import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, headingStyle, mutedTextStyle, buttonStyle, colors } from "./styles";

interface CoachingApplicationApprovedEmailProps {
  firstName: string;
  tierLabel: string;
  dashboardUrl: string;
  decisionReason?: string | null;
}

export default function CoachingApplicationApprovedEmail({
  firstName,
  tierLabel,
  dashboardUrl,
  decisionReason,
}: CoachingApplicationApprovedEmailProps) {
  return (
    <EmailLayout preview="Your coaching recommendation is ready">
      <Text style={headingStyle}>Your coaching recommendation is ready</Text>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Following your conversation, Shruti recommends {tierLabel}. The next step is to create or
        sign in to your Private Studio, review the recommendation and complete the agreements and
        payment when you are ready.
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
        <Text style={bodyTextStyle}>What happens after payment:</Text>
        <Text style={mutedTextStyle}>1. Your coaching client profile is opened.</Text>
        <Text style={mutedTextStyle}>2. Shruti sets up the agreed support in Everfit.</Text>
        <Text style={mutedTextStyle}>3. Your onboarding status appears in your dashboard.</Text>
      </Section>
      <Section style={{ textAlign: "center" }}>
        <Link href={dashboardUrl} style={buttonStyle}>
          Continue to coaching dashboard
        </Link>
      </Section>
    </EmailLayout>
  );
}
