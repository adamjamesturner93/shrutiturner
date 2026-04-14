import { Section, Text, Link, Hr } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import {
  colors,
  fonts,
  headingStyle,
  bodyTextStyle,
  buttonStyle,
  dividerStyle,
  mutedTextStyle,
} from "./styles";

interface WinBackEmailProps {
  firstName?: string;
  daysSinceLastClass?: string;
  lastClassName?: string;
  scheduleUrl?: string;
  blogUrl?: string;
}

export default function WinBackEmail({
  firstName = "Sarah",
  daysSinceLastClass = "34",
  lastClassName = "Adaptive Yoga Flow",
  scheduleUrl = "https://shrutiturner.co.uk/schedule",
  blogUrl = "https://shrutiturner.co.uk/blog",
}: WinBackEmailProps) {
  return (
    <EmailLayout
      preview={`${firstName}, your practice is here when you're ready`}
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
        Your practice is here when {"you're"} ready
      </Text>

      <Text style={bodyTextStyle}>Hi {firstName},</Text>

      <Text style={bodyTextStyle}>
        {"It's"} been a little while since your last class, and I just wanted to gently check in.
        Life gets full, bodies have seasons, and {"there's"} absolutely no pressure here.
      </Text>

      <Text style={bodyTextStyle}>
        But I also know that sometimes a small nudge is all we need.
      </Text>

      {/* Last class card */}
      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "24px 28px",
          margin: "8px 0 28px",
          borderLeft: `3px solid ${colors.brandAccentLight}`,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.body,
            color: colors.muted,
            fontSize: "12px",
            textTransform: "uppercase" as const,
            letterSpacing: "0.06em",
            fontWeight: "600",
            margin: "0 0 8px 0",
          }}
        >
          Your last session
        </Text>
        <Text
          style={{
            fontFamily: fonts.heading,
            color: colors.brandDark,
            fontSize: "18px",
            fontWeight: "700",
            margin: "0 0 4px 0",
          }}
        >
          {lastClassName}
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            color: colors.muted,
            fontSize: "14px",
            margin: "0",
          }}
        >
          {daysSinceLastClass} days ago
        </Text>
      </Section>

      {/* Gentle options */}
      <Text
        style={{
          ...headingStyle,
          fontSize: "18px",
          marginBottom: "16px",
        }}
      >
        A few ways back in
      </Text>

      <Section
        style={{
          backgroundColor: "#ffffff",
          border: `1px solid ${colors.border}`,
          borderRadius: "8px",
          padding: "20px 24px",
          marginBottom: "12px",
        }}
      >
        <Text
          style={{
            fontFamily: fonts.heading,
            color: colors.brandDark,
            fontSize: "16px",
            fontWeight: "700",
            margin: "0 0 6px 0",
          }}
        >
          Book a gentle class
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            color: colors.muted,
            fontSize: "14px",
            lineHeight: "1.6",
            margin: "0 0 12px 0",
          }}
        >
          {"There's"} no need to dive straight into the deep end. A restorative session or gentle
          flow is a lovely way to reconnect.
        </Text>
        <Link
          href={scheduleUrl}
          style={{
            fontFamily: fonts.body,
            color: colors.brandAccent,
            fontSize: "14px",
            fontWeight: "500",
            textDecoration: "underline",
          }}
        >
          {"View the schedule \u2192"}
        </Link>
      </Section>

      <Section
        style={{
          backgroundColor: "#ffffff",
          border: `1px solid ${colors.border}`,
          borderRadius: "8px",
          padding: "20px 24px",
          marginBottom: "28px",
        }}
      >
        <Text
          style={{
            fontFamily: fonts.heading,
            color: colors.brandDark,
            fontSize: "16px",
            fontWeight: "700",
            margin: "0 0 6px 0",
          }}
        >
          Read something that helps
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            color: colors.muted,
            fontSize: "14px",
            lineHeight: "1.6",
            margin: "0 0 12px 0",
          }}
        >
          Sometimes inspiration comes before action. Browse evidence-based articles on training with
          chronic conditions, building strength gently, and more.
        </Text>
        <Link
          href={blogUrl}
          style={{
            fontFamily: fonts.body,
            color: colors.brandAccent,
            fontSize: "14px",
            fontWeight: "500",
            textDecoration: "underline",
          }}
        >
          {"Browse blog posts \u2192"}
        </Link>
      </Section>

      <Section style={{ textAlign: "center" as const, marginBottom: "28px" }}>
        <Link href={scheduleUrl} style={buttonStyle}>
          Browse the schedule
        </Link>
      </Section>

      <Hr style={dividerStyle} />

      <Text style={mutedTextStyle}>
        {
          "If your circumstances have changed or you'd like to pause your account, just reply to this email and I'll help you with that. No questions asked."
        }
      </Text>

      <Text style={{ ...bodyTextStyle, marginTop: "24px" }}>
        Thinking of you,
        <br />
        Shruti
      </Text>
    </EmailLayout>
  );
}
