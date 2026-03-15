import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, headingStyle, mutedTextStyle, buttonStyle, colors } from "./styles";

interface CoachingApplicationConfirmationEmailProps {
  firstName: string;
  tierLabel: string;
  dashboardUrl: string;
}

export default function CoachingApplicationConfirmationEmail({
  firstName,
  tierLabel,
  dashboardUrl,
}: CoachingApplicationConfirmationEmailProps) {
  return (
    <EmailLayout preview="Your coaching application has been received">
      <Text style={headingStyle}>Application received</Text>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Thanks for applying for {tierLabel}. Your application is in and will be reviewed personally.
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
        <Text style={mutedTextStyle}>1. Your context and goals are reviewed.</Text>
        <Text style={mutedTextStyle}>2. You will hear back within 48 hours.</Text>
        <Text style={mutedTextStyle}>
          3. If it looks like a fit, the next onboarding step will be outlined clearly.
        </Text>
      </Section>
      <Section style={{ textAlign: "center" }}>
        <Link href={dashboardUrl} style={buttonStyle}>
          View coaching dashboard
        </Link>
      </Section>
    </EmailLayout>
  );
}
