import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, headingStyle, mutedTextStyle, buttonStyle, colors } from "./styles";

interface ContactNotificationEmailProps {
  name: string;
  email: string;
  topic: string;
  message: string;
  conditions?: string;
  howFound?: string;
  replyToUrl?: string;
}

export default function ContactNotificationEmail({
  name,
  email,
  topic,
  message,
  conditions,
  howFound,
  replyToUrl = `mailto:${email}`,
}: ContactNotificationEmailProps) {
  return (
    <EmailLayout preview={`New contact enquiry from ${name}`}>
      <Text style={headingStyle}>New contact enquiry</Text>
      <Text style={bodyTextStyle}>
        {name} has submitted a new enquiry through the public contact form.
      </Text>

      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "24px",
          margin: "20px 0",
        }}
      >
        <Text style={bodyTextStyle}>
          <strong>Name:</strong> {name}
        </Text>
        <Text style={bodyTextStyle}>
          <strong>Email:</strong> {email}
        </Text>
        <Text style={bodyTextStyle}>
          <strong>Topic:</strong> {topic}
        </Text>
        {conditions ? (
          <Text style={bodyTextStyle}>
            <strong>Conditions / context:</strong> {conditions}
          </Text>
        ) : null}
        {howFound ? (
          <Text style={bodyTextStyle}>
            <strong>How they found you:</strong> {howFound}
          </Text>
        ) : null}
      </Section>

      <Text style={mutedTextStyle}>{message}</Text>

      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Link href={replyToUrl} style={buttonStyle}>
          Reply by email
        </Link>
      </Section>
    </EmailLayout>
  );
}
