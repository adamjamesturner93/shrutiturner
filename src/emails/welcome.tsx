import { Section, Text, Link, Hr } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { colors, fonts, headingStyle, bodyTextStyle, buttonStyle, dividerStyle } from "./styles";

interface WelcomeEmailProps {
  firstName?: string;
  leadMagnetTitle?: string;
  leadMagnetDescription?: string;
  downloadUrl?: string;
  ctaLabel?: string;
  welcomeCopy?: string;
  classesUrl?: string;
  aboutUrl?: string;
  privacyUrl?: string;
  unsubscribeUrl?: string;
}

export default function WelcomeEmail({
  firstName = "there",
  leadMagnetTitle = "The Foundations Guide: 5 Principles for a Sustainable Practice",
  leadMagnetDescription = "A practical guide to building a yoga and movement practice that respects your body's complexity — with exercises, reflections, and evidence-based insights you can start using today.",
  downloadUrl = "https://shrutiturner.com/download/foundations-guide",
  ctaLabel = "Download your guide",
  welcomeCopy,
  classesUrl = "https://shrutiturner.com/classes",
  aboutUrl = "https://shrutiturner.com/about",
  privacyUrl = "https://shrutiturner.com/privacy",
  unsubscribeUrl = "https://shrutiturner.com/unsubscribe",
}: WelcomeEmailProps) {
  const welcomeParagraphs = welcomeCopy
    ? welcomeCopy
        .split(/\n\s*\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    : null;

  return (
    <EmailLayout
      preview={`Welcome, ${firstName} — your free guide is ready`}
      unsubscribeUrl={unsubscribeUrl}
      privacyUrl={privacyUrl}
      category="marketing"
    >
      <Text
        style={{
          ...headingStyle,
          fontSize: "26px",
          lineHeight: "1.2",
          marginBottom: "24px",
        }}
      >
        {"Welcome — I'm glad you're here."}
      </Text>

      <Text style={bodyTextStyle}>Hi {firstName},</Text>

      {welcomeParagraphs && welcomeParagraphs.length > 0 ? (
        welcomeParagraphs.map((paragraph, index) => (
          <Text key={index} style={bodyTextStyle}>
            {paragraph}
          </Text>
        ))
      ) : (
        <Text style={bodyTextStyle}>
          Thank you for joining this community. I believe in training that is intelligent,
          evidence-based, and built for real bodies and I&apos;m so glad you do too.
        </Text>
      )}

      {/* Lead Magnet Card */}
      <Section
        style={{
          backgroundColor: colors.brandAccent,
          borderRadius: "8px",
          padding: "32px 28px",
          marginTop: "8px",
          marginBottom: "28px",
        }}
      >
        <Text
          style={{
            fontFamily: fonts.body,
            color: colors.brandAccentLight,
            fontSize: "12px",
            textTransform: "uppercase" as const,
            letterSpacing: "0.08em",
            fontWeight: "600",
            margin: "0 0 12px 0",
          }}
        >
          Your free resource
        </Text>
        <Text
          style={{
            fontFamily: fonts.heading,
            color: colors.brandWhite,
            fontSize: "20px",
            fontWeight: "700",
            lineHeight: "1.3",
            margin: "0 0 12px 0",
          }}
        >
          {leadMagnetTitle}
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            color: "rgba(250, 250, 248, 0.8)",
            fontSize: "15px",
            lineHeight: "1.6",
            margin: "0 0 24px 0",
          }}
        >
          {leadMagnetDescription}
        </Text>
        <Link
          href={downloadUrl}
          style={{
            ...buttonStyle,
            backgroundColor: colors.brandWhite,
            color: colors.brandAccent,
            fontWeight: "600",
          }}
        >
          {ctaLabel}
        </Link>
      </Section>

      <Hr style={dividerStyle} />

      <Text
        style={{
          ...headingStyle,
          fontSize: "18px",
          marginBottom: "16px",
        }}
      >
        What to expect from me
      </Text>

      <Text style={bodyTextStyle}>
        I send occasional emails about launch updates, classes, coaching, retreat openings, and
        thoughtful notes on building strength with a fluctuating body. No spam, no filler.
      </Text>

      <Text style={bodyTextStyle}>In the meantime, feel free to explore: </Text>

      <Text style={{ ...bodyTextStyle, paddingLeft: "8px" }}>
        {"\u2022 "}
        <Link href={classesUrl} style={{ color: colors.brandAccent, textDecoration: "underline" }}>
          Browse upcoming classes
        </Link>
        <br />
        {"\u2022 "}
        <Link href={aboutUrl} style={{ color: colors.brandAccent, textDecoration: "underline" }}>
          Learn more about my approach
        </Link>
        <br />
        {"\u2022 "}
        <Link href={privacyUrl} style={{ color: colors.brandAccent, textDecoration: "underline" }}>
          Review the privacy policy
        </Link>
      </Text>

      <Text style={{ ...bodyTextStyle, marginTop: "24px" }}>
        With warmth,
        <br />
        Shruti
      </Text>
    </EmailLayout>
  );
}
