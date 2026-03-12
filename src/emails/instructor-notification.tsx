import { Section, Text, Link, Hr } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { colors, headingStyle, bodyTextStyle, buttonStyle, dividerStyle } from "./styles";

interface InstructorNotificationEmailProps {
  type?: "first-signup" | "last-cancel";
  className?: string;
  classTime?: string;
  classDate?: string;
  attendeeCount?: number;
  attendeeName?: string;
  rosterUrl?: string;
}

export default function InstructorNotificationEmail({
  type = "first-signup",
  className = "Slow Flow Yoga",
  classTime = "10:00 AM",
  classDate = "Tomorrow, March 15th",
  attendeeCount = 1,
  attendeeName = "Student",
  rosterUrl = "https://shrutiturner.com/admin/dashboard",
}: InstructorNotificationEmailProps) {
  const isFirstSignup = type === "first-signup";

  return (
    <EmailLayout preview={isFirstSignup ? `New booking: ${className}` : `Class empty: ${className}`}>
      <Text
        style={{
          ...headingStyle,
          fontSize: "24px",
          lineHeight: "1.3",
          marginBottom: "24px",
        }}
      >
        {isFirstSignup ? "New student signed up" : "Class empty alert"}
      </Text>

      <Text style={bodyTextStyle}>
        {isFirstSignup
          ? `${attendeeName} just booked into ${className}.`
          : `The last attendee (${attendeeName}) cancelled ${className}.`}
      </Text>

      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "24px 28px",
          margin: "8px 0 28px",
        }}
      >
        <Text style={{ ...bodyTextStyle, marginBottom: "8px" }}>
          <strong>Class:</strong> {className}
        </Text>
        <Text style={{ ...bodyTextStyle, marginBottom: "8px" }}>
          <strong>Date:</strong> {classDate}
        </Text>
        <Text style={{ ...bodyTextStyle, marginBottom: "8px" }}>
          <strong>Time:</strong> {classTime}
        </Text>
        <Text style={{ ...bodyTextStyle, marginBottom: "0" }}>
          <strong>Attendees:</strong> {attendeeCount}
        </Text>
      </Section>

      <Section style={{ textAlign: "center", marginBottom: "16px" }}>
        <Link href={rosterUrl} style={buttonStyle}>
          View Class Roster
        </Link>
      </Section>

      <Hr style={dividerStyle} />
    </EmailLayout>
  );
}

