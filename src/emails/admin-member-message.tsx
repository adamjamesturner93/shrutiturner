import { Section, Text } from "@react-email/components";
import { EmailLayout } from "@/emails/components/email-layout";

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
      <Section>
        <Text style={{ fontSize: "16px", lineHeight: "26px", margin: "0 0 16px" }}>
          Hi {memberFirstName},
        </Text>
        {paragraphs.map((paragraph) => (
          <Text
            key={paragraph}
            style={{ fontSize: "16px", lineHeight: "26px", margin: "0 0 16px" }}
          >
            {paragraph}
          </Text>
        ))}
        <Text style={{ fontSize: "16px", lineHeight: "26px", margin: "24px 0 0" }}>
          Warmly,
          <br />
          {adminName}
        </Text>
      </Section>
    </EmailLayout>
  );
}
