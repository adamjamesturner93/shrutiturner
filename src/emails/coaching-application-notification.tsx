import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, headingStyle, mutedTextStyle, buttonStyle, colors } from "./styles";

interface CoachingApplicationNotificationEmailProps {
  name: string;
  email: string;
  summary: string[];
  adminUrl: string;
}

export default function CoachingApplicationNotificationEmail({
  name,
  email,
  summary,
  adminUrl,
}: CoachingApplicationNotificationEmailProps) {
  return (
    <EmailLayout preview={`New coaching enquiry from ${name}`}>
      <Text style={headingStyle}>New coaching enquiry</Text>
      <Text style={bodyTextStyle}>{name} has submitted a new coaching enquiry.</Text>
      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "24px",
          margin: "20px 0",
        }}
      >
        <Text style={bodyTextStyle}>
          <strong>Email:</strong> {email}
        </Text>
        {summary.map((line) => (
          <Text key={line} style={mutedTextStyle}>
            {line}
          </Text>
        ))}
      </Section>
      <Section style={{ textAlign: "center" }}>
        <Link href={adminUrl} style={buttonStyle}>
          Review enquiry
        </Link>
      </Section>
    </EmailLayout>
  );
}
