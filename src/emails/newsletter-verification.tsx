import { Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, buttonStyle, colors, headingStyle } from "./styles";

interface NewsletterVerificationEmailProps {
  firstName?: string;
  privacyUrl: string;
  unsubscribeUrl: string;
  verificationUrl: string;
}

export default function NewsletterVerificationEmail({
  firstName = "there",
  privacyUrl,
  unsubscribeUrl,
  verificationUrl,
}: NewsletterVerificationEmailProps) {
  return (
    <EmailLayout
      preview="Confirm your email to get launch updates and your free guide"
      unsubscribeUrl={unsubscribeUrl}
      privacyUrl={privacyUrl}
      category="marketing"
    >
      <Text style={{ ...headingStyle, fontSize: "26px", lineHeight: "1.2", marginBottom: "24px" }}>
        Confirm your email
      </Text>

      <Text style={bodyTextStyle}>Hi {firstName},</Text>

      <Text style={bodyTextStyle}>
        Thanks for signing up. Confirm your email address to receive launch updates and the free
        guide, <em>5 Yoga Poses That Actually Build Strength</em>.
      </Text>

      <Section
        style={{
          backgroundColor: "#f6efe7",
          border: `1px solid ${colors.border}`,
          borderRadius: "10px",
          padding: "24px",
          margin: "24px 0",
        }}
      >
        <Text style={{ ...bodyTextStyle, margin: "0 0 16px 0" }}>
          This confirmation link is valid for 24 hours. No marketing emails are sent until you
          confirm.
        </Text>
        <Link href={verificationUrl} style={buttonStyle}>
          Confirm email address
        </Link>
      </Section>

      <Text style={bodyTextStyle}>
        By confirming, you agree to receive launch updates and occasional emails about classes,
        coaching, and offers. You can unsubscribe at any time.
      </Text>

      <Text style={bodyTextStyle}>
        Read the privacy policy:{" "}
        <Link href={privacyUrl} style={{ color: colors.brandAccent, textDecoration: "underline" }}>
          {privacyUrl}
        </Link>
      </Text>
    </EmailLayout>
  );
}
