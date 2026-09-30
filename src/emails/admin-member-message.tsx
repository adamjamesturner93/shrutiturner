import { Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "@/emails/components/email-layout";

import { bodyTextStyle, headingStyle } from "./styles";

type AdminMemberMessageEmailProps = {
  memberFirstName: string;
  adminName: string;
  messageBody: string;
};

export default function AdminMemberMessageEmail({
  memberFirstName,
  adminName,
  messageBody,
}: AdminMemberMessageEmailProps) {
  const paragraphs = messageBody
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <EmailLayout preview={`A note from ${adminName}`}>
      <Heading as="h1" style={headingStyle}>
        A note from {adminName}
      </Heading>
      <Section>
        <Text style={{ ...bodyTextStyle, whiteSpace: "pre-line" }}>Hi {memberFirstName},</Text>
        {paragraphs.map((paragraph) => (
          <Text key={paragraph} style={{ ...bodyTextStyle, whiteSpace: "pre-line" }}>
            {paragraph}
          </Text>
        ))}
        <Text style={{ ...bodyTextStyle, marginTop: "24px" }}>
          Warmly,
          <br />
          {adminName}
        </Text>
      </Section>
    </EmailLayout>
  );
}
