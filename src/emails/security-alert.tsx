import { Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, colors, headingStyle, mutedTextStyle } from "./styles";

type SecurityAlertEmailProps = {
  title: string;
  summary: string;
  email?: string | null;
  ip?: string | null;
  reason: string;
  occurredAt: string;
};

export default function SecurityAlertEmail({
  title,
  summary,
  email,
  ip,
  reason,
  occurredAt,
}: SecurityAlertEmailProps) {
  return (
    <EmailLayout preview={title}>
      <Text style={headingStyle}>{title}</Text>
      <Text style={bodyTextStyle}>{summary}</Text>

      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "24px",
          margin: "20px 0",
        }}
      >
        {email ? (
          <Text style={bodyTextStyle}>
            <strong>Email:</strong> {email}
          </Text>
        ) : null}
        {ip ? (
          <Text style={bodyTextStyle}>
            <strong>IP:</strong> {ip}
          </Text>
        ) : null}
        <Text style={bodyTextStyle}>
          <strong>Reason:</strong> {reason}
        </Text>
        <Text style={bodyTextStyle}>
          <strong>Occurred at:</strong> {occurredAt}
        </Text>
      </Section>

      <Text style={mutedTextStyle}>
        This alert was generated automatically by the authentication security pipeline.
      </Text>
    </EmailLayout>
  );
}
