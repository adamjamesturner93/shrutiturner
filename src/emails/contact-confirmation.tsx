import { Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, colors, headingStyle, mutedTextStyle } from "./styles";

interface ContactConfirmationEmailProps {
  firstName: string;
  topic: string;
}

export default function ContactConfirmationEmail({
  firstName,
  topic,
}: ContactConfirmationEmailProps) {
  return (
    <EmailLayout preview="Your enquiry has been received">
      <Text style={headingStyle}>Enquiry received</Text>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Thanks for getting in touch. Your enquiry about {topic} has been received and will be read
        personally.
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
        <Text style={mutedTextStyle}>1. Your message and any context you shared are reviewed.</Text>
        <Text style={mutedTextStyle}>2. You will usually hear back within 2 working days.</Text>
        <Text style={mutedTextStyle}>
          3. If another route fits better, that will be explained clearly.
        </Text>
      </Section>
      <Text style={mutedTextStyle}>
        This confirmation is only about your enquiry. You have not been added to the newsletter.
      </Text>
    </EmailLayout>
  );
}
