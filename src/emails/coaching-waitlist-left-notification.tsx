import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, buttonStyle, colors, headingStyle, mutedTextStyle } from "./styles";

interface CoachingWaitlistLeftNotificationEmailProps {
  clientName: string;
  clientEmail: string;
  tierLabel: string;
  adminUrl: string;
}

export default function CoachingWaitlistLeftNotificationEmail({
  clientName,
  clientEmail,
  tierLabel,
  adminUrl,
}: CoachingWaitlistLeftNotificationEmailProps) {
  return (
    <EmailLayout preview={`${clientName} left the coaching waiting list`}>
      <Text style={headingStyle}>Someone left the coaching waiting list</Text>
      <Text style={bodyTextStyle}>
        {clientName} has left the coaching waiting list from their coaching dashboard.
      </Text>
      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "24px",
          margin: "20px 0",
        }}
      >
        <Text style={mutedTextStyle}>Email: {clientEmail}</Text>
        <Text style={mutedTextStyle}>Application: {tierLabel}</Text>
      </Section>
      <Section style={{ textAlign: "center" }}>
        <Link href={adminUrl} style={buttonStyle}>
          View coaching admin
        </Link>
      </Section>
    </EmailLayout>
  );
}
