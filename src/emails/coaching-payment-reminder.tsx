import { Heading, Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { headingStyle, bodyTextStyle, buttonStyle, mutedTextStyle, colors } from "./styles";

interface CoachingPaymentReminderEmailProps {
  firstName: string;
  tierLabel: string;
  dashboardUrl: string;
}

export default function CoachingPaymentReminderEmail({
  firstName,
  tierLabel,
  dashboardUrl,
}: CoachingPaymentReminderEmailProps) {
  return (
    <EmailLayout preview="A reminder to complete your 1:1 payment">
      <Heading as="h1" style={headingStyle}>
        Complete your coaching payment
      </Heading>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        A friendly reminder that your application for {tierLabel} has been approved.
      </Text>
      <Text style={bodyTextStyle}>
        When you are ready, sign in to your My Studio, review the agreements and complete payment
        from your dashboard.
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
          Payment needs to happen through your website account so your agreements, billing and
          onboarding status all stay linked in one place.
        </Text>
      </Section>
      <Section style={{ textAlign: "center" }}>
        <Link href={dashboardUrl} style={buttonStyle}>
          Continue to dashboard
        </Link>
      </Section>
    </EmailLayout>
  );
}
