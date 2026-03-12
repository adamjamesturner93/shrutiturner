import { Section, Text, Hr } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import {
  colors,
  fonts,
  headingStyle,
  bodyTextStyle,
  mutedTextStyle,
  dividerStyle,
} from "./styles";

interface AuthCodeEmailProps {
  code?: string;
  expiryMinutes?: number;
}

export default function AuthCodeEmail({
  code = "847 291",
  expiryMinutes = 10,
}: AuthCodeEmailProps) {
  return (
    <EmailLayout preview={`Your login code is ${code}`}>
      <Text
        style={{
          ...headingStyle,
          fontSize: "24px",
          lineHeight: "1.3",
          marginBottom: "20px",
        }}
      >
        Your login code
      </Text>

      <Text style={bodyTextStyle}>
        Enter this code to sign in to your account. The code will expire in {expiryMinutes} minutes.
      </Text>

      {/* Code Display */}
      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "32px 28px",
          textAlign: "center" as const,
          margin: "8px 0 28px",
          border: `1px solid ${colors.border}`,
        }}
      >
        <Text
          style={{
            fontFamily: "'SF Mono', 'Roboto Mono', Menlo, monospace",
            color: colors.brandDark,
            fontSize: "40px",
            fontWeight: "700",
            letterSpacing: "0.2em",
            margin: "0",
            lineHeight: "1",
          }}
        >
          {code}
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            color: colors.muted,
            fontSize: "13px",
            margin: "16px 0 0 0",
          }}
        >
          Expires in {expiryMinutes} minutes
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      <Text style={mutedTextStyle}>
        {"If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake."}
      </Text>

      <Text style={{ ...mutedTextStyle, marginTop: "16px" }}>
        {"For security, never share this code with anyone. We'll never ask you for it."}
      </Text>
    </EmailLayout>
  );
}
