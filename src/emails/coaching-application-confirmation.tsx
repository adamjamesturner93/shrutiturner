import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, headingStyle, mutedTextStyle, buttonStyle, colors } from "./styles";

interface CoachingApplicationConfirmationEmailProps {
  firstName: string;
  dashboardUrl?: string;
}

export default function CoachingApplicationConfirmationEmail({
  firstName,
  dashboardUrl,
}: CoachingApplicationConfirmationEmailProps) {
  return (
    <EmailLayout preview="Your coaching enquiry has been received">
      <Text style={headingStyle}>Enquiry received</Text>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Thanks for getting in touch about coaching. Shruti will read your enquiry personally and get
        back to you within two working days to arrange a consultation or ask any questions needed
        before you speak.
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
        <Text style={mutedTextStyle}>1. Shruti reviews what you have shared.</Text>
        <Text style={mutedTextStyle}>
          2. Look out for a personal reply within two working days.
        </Text>
        <Text style={mutedTextStyle}>
          3. Don’t forget to check your spam folder if you cannot see the reply.
        </Text>
      </Section>
      {dashboardUrl ? (
        <Section style={{ textAlign: "center" }}>
          <Link href={dashboardUrl} style={buttonStyle}>
            View coaching dashboard
          </Link>
        </Section>
      ) : null}
    </EmailLayout>
  );
}
