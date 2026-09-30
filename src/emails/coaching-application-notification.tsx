import { Heading, Section, Text, Link } from "@react-email/components";
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
      <Heading as="h1" style={headingStyle}>
        New coaching enquiry
      </Heading>
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
