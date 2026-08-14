import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, headingStyle, mutedTextStyle, buttonStyle, colors } from "./styles";

interface CoachingApplicationRejectedEmailProps {
  firstName: string;
  tierLabel: string;
  decisionReason: string;
  dashboardUrl: string;
}

export default function CoachingApplicationRejectedEmail({
  firstName,
  tierLabel,
  decisionReason,
  dashboardUrl,
}: CoachingApplicationRejectedEmailProps) {
  return (
    <EmailLayout preview="Your coaching enquiry has been reviewed">
      <Text style={headingStyle}>Your enquiry has been reviewed</Text>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Thank you for your coaching enquiry. Shruti has reviewed what you discussed, and {tierLabel}
        is not the right fit right now.
      </Text>
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
      <Section style={{ textAlign: "center" }}>
        <Link href={dashboardUrl} style={buttonStyle}>
          View coaching dashboard
        </Link>
      </Section>
    </EmailLayout>
  );
}
