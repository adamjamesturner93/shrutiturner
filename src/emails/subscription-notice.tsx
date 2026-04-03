import { Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, buttonStyle, colors, headingStyle, mutedTextStyle } from "./styles";

interface SubscriptionNoticeEmailProps {
  preview: string;
  title: string;
  firstName?: string;
  paragraphs: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  footnote?: string;
}

export default function SubscriptionNoticeEmail({
  preview,
  title,
  firstName = "there",
  paragraphs,
  ctaLabel,
  ctaUrl,
  footnote,
}: SubscriptionNoticeEmailProps) {
  return (
    <EmailLayout preview={preview}>
      <Text
        style={{
          ...headingStyle,
          fontSize: "24px",
          lineHeight: "1.3",
          marginBottom: "24px",
        }}
      >
        {title}
      </Text>

      <Text style={bodyTextStyle}>Hi {firstName},</Text>

      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "24px 28px",
          margin: "8px 0 28px",
        }}
      >
        {paragraphs.map((paragraph) => (
          <Text key={paragraph} style={{ ...bodyTextStyle, marginBottom: "12px" }}>
            {paragraph}
          </Text>
        ))}
      </Section>

      {ctaLabel && ctaUrl ? (
        <Section style={{ textAlign: "center", marginBottom: "16px" }}>
          <Link href={ctaUrl} style={buttonStyle}>
            {ctaLabel}
          </Link>
        </Section>
      ) : null}

      {footnote ? <Text style={mutedTextStyle}>{footnote}</Text> : null}
    </EmailLayout>
  );
}
