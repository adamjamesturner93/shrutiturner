import { Section, Text, Link, Hr } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import {
  colors,
  fonts,
  headingStyle,
  bodyTextStyle,
  mutedTextStyle,
  buttonStyle,
  dividerStyle,
} from "./styles";

interface ClassUnbookingEmailProps {
  firstName?: string;
  className?: string;
  classDate?: string;
  classTime?: string;
  rebookUrl?: string;
}

export default function ClassUnbookingEmail({
  firstName = "there",
  className = "Strength & Flow",
  classDate = "Thursday, 6 March 2026",
  classTime = "9:30 AM",
  rebookUrl = "https://shrutiturner.co.uk/classes",
}: ClassUnbookingEmailProps) {
  return (
    <EmailLayout preview={`Booking cancelled: ${className} on ${classDate}`}>
      <Text
        style={{
          ...headingStyle,
          fontSize: "24px",
          lineHeight: "1.3",
          marginBottom: "24px",
        }}
      >
        Booking cancelled
      </Text>

      <Text style={bodyTextStyle}>Hi {firstName},</Text>

      <Text style={bodyTextStyle}>
        {"This is to confirm your booking for the following class has been cancelled:"}
      </Text>

      {/* Cancelled Class Card */}
      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "24px 28px",
          margin: "8px 0 28px",
          borderLeft: `3px solid ${colors.muted}`,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.heading,
            color: colors.brandDark,
            fontSize: "18px",
            fontWeight: "700",
            margin: "0 0 12px 0",
          }}
        >
          {className}
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            color: colors.muted,
            fontSize: "15px",
            margin: "0",
            lineHeight: "1.6",
          }}
        >
          {classDate} at {classTime}
        </Text>
      </Section>

      <Text style={bodyTextStyle}>
        {
          "If this was a mistake, or you'd like to join a different session, you can browse upcoming classes below."
        }
      </Text>

      <Section style={{ textAlign: "center" as const, marginBottom: "8px" }}>
        <Link href={rebookUrl} style={buttonStyle}>
          Browse upcoming classes
        </Link>
      </Section>

      <Hr style={dividerStyle} />

      <Text style={mutedTextStyle}>
        {
          "If you have any questions about your booking or our cancellation policy, feel free to reply to this email."
        }
      </Text>

      <Text style={{ ...bodyTextStyle, marginTop: "24px" }}>
        Take care,
        <br />
        Shruti
      </Text>
    </EmailLayout>
  );
}
