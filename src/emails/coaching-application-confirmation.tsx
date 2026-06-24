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
    <EmailLayout preview="Your 1:1 application has been received">
      <Text style={headingStyle}>Application received</Text>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Thanks for requesting to work with Shruti to support your health and wellbeing. Your
        application for {tierLabel} is in and will be reviewed personally.
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
        <Text style={mutedTextStyle}>
          2. Look out for an email from Shruti within the next 48 hours.
        </Text>
        <Text style={mutedTextStyle}>
          3. Don’t forget to check your spam folder if you cannot see the reply.
        </Text>
      </Section>
      <Section style={{ textAlign: "center" }}>
        <Link href={dashboardUrl} style={buttonStyle}>
          View your dashboard
        </Link>
      </Section>
    </EmailLayout>
  );
}
