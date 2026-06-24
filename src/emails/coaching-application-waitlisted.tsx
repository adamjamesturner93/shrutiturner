import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, headingStyle, mutedTextStyle, buttonStyle, colors } from "./styles";

interface CoachingApplicationWaitlistedEmailProps {
  firstName: string;
  tierLabel: string;
  dashboardUrl: string;
  decisionReason?: string | null;
}

export default function CoachingApplicationWaitlistedEmail({
  firstName,
  tierLabel,
  dashboardUrl,
  decisionReason,
}: CoachingApplicationWaitlistedEmailProps) {
  return (
    <EmailLayout preview="You are on the 1:1 waiting list">
      <Text style={headingStyle}>You are on the waiting list</Text>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Thank you for applying for {tierLabel}. Shruti has reviewed your application and would like
        to keep you on the 1:1 waiting list until capacity opens.
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
        <Text style={mutedTextStyle}>1. No payment is due while you are on the waiting list.</Text>
        <Text style={mutedTextStyle}>
          2. If a suitable place opens, Shruti will approve your application and invite payment.
        </Text>
        <Text style={mutedTextStyle}>3. You can leave the waiting list from your dashboard.</Text>
      </Section>
      <Section style={{ textAlign: "center" }}>
        <Link href={dashboardUrl} style={buttonStyle}>
          View your dashboard
        </Link>
      </Section>
    </EmailLayout>
  );
}
