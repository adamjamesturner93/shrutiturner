import { Section, Text, Link, Hr } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { colors, fonts, bodyTextStyle, buttonStyle, dividerStyle, mutedTextStyle } from "./styles";

interface BirthdayEmailProps {
  firstName?: string;
  creditCode?: string;
  creditAmount?: string;
  scheduleUrl?: string;
}

export default function BirthdayEmail({
  firstName = "Sarah",
  creditCode = "BDAY-ST2026",
  creditAmount = "\u00a35",
  scheduleUrl = "https://shrutiturner.com/schedule",
}: BirthdayEmailProps) {
  return (
    <EmailLayout preview={`Happy birthday, ${firstName} — a small gift from me to you`}>
      {/* Birthday hero section */}
      <Section
        style={{
          backgroundColor: colors.brandDark,
          borderRadius: "8px",
          padding: "40px 28px",
          marginBottom: "28px",
          textAlign: "center" as const,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.heading,
            color: colors.brandWhite,
            fontSize: "28px",
            fontWeight: "700",
            lineHeight: "1.2",
            margin: "0 0 8px 0",
          }}
        >
          Happy birthday, {firstName}.
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            color: "rgba(250, 250, 248, 0.6)",
            fontSize: "15px",
            lineHeight: "1.6",
            margin: "0",
          }}
        >
          A small gift to celebrate your day.
        </Text>
      </Section>

      <Text style={bodyTextStyle}>Hi {firstName},</Text>

      <Text style={bodyTextStyle}>
        Wishing you a genuinely wonderful birthday. I hope today brings you rest, joy, and whatever
        your body needs.
      </Text>

      <Text style={bodyTextStyle}>
        As a small thank you for being part of this community, {"here's"} a credit to use towards
        any class:
      </Text>

      {/* Credit Code Card */}
      <Section
        style={{
          backgroundColor: "#ffffff",
          border: `1px solid ${colors.border}`,
          borderRadius: "8px",
          padding: "32px 28px",
          marginTop: "8px",
          marginBottom: "28px",
          textAlign: "center" as const,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.body,
            color: colors.muted,
            fontSize: "12px",
            textTransform: "uppercase" as const,
            letterSpacing: "0.08em",
            fontWeight: "600",
            margin: "0 0 12px 0",
          }}
        >
          Your birthday credit
        </Text>
        <Text
          style={{
            fontFamily: fonts.heading,
            color: colors.brandAccent,
            fontSize: "36px",
            fontWeight: "700",
            margin: "0 0 16px 0",
            lineHeight: "1",
          }}
        >
          {creditAmount}
        </Text>
        <Section
          style={{
            backgroundColor: colors.secondaryBg,
            borderRadius: "6px",
            padding: "14px 20px",
            display: "inline-block" as const,
          }}
        >
          <Text
            style={{
              fontFamily: "'SF Mono', 'Roboto Mono', Menlo, monospace",
              color: colors.brandDark,
              fontSize: "18px",
              fontWeight: "600",
              letterSpacing: "0.1em",
              margin: "0",
            }}
          >
            {creditCode}
          </Text>
        </Section>
        <Text
          style={{
            fontFamily: fonts.body,
            color: colors.muted,
            fontSize: "13px",
            margin: "16px 0 0 0",
            lineHeight: "1.5",
          }}
        >
          Apply this code at checkout, or it will be
          <br />
          automatically added to your account within 24 hours.
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const, marginBottom: "28px" }}>
        <Link href={scheduleUrl} style={buttonStyle}>
          Browse the schedule
        </Link>
      </Section>

      <Hr style={dividerStyle} />

      <Text style={mutedTextStyle}>
        This credit is valid for 30 days from today and can be used towards any class booking.
      </Text>

      <Text style={{ ...bodyTextStyle, marginTop: "24px" }}>
        Have a lovely day,
        <br />
        Shruti
      </Text>
    </EmailLayout>
  );
}
