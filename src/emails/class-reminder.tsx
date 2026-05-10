import { Section, Text, Link, Hr } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import {
  colors,
  headingStyle,
  bodyTextStyle,
  mutedTextStyle,
  buttonStyle,
  dividerStyle,
} from "./styles";

interface ClassReminderEmailProps {
  firstName?: string;
  className?: string;
  classTime?: string;
  joinLink?: string;
  preJoinWindowLabel?: string;
  lateJoinCutoffLabel?: string;
}

export default function ClassReminderEmail({
  firstName = "there",
  className = "Slow Flow Yoga",
  classTime = "10:00 AM",
  joinLink = "https://shrutiturner.co.uk/dashboard/schedule",
  preJoinWindowLabel = "10 minutes",
  lateJoinCutoffLabel = "5 minutes",
}: ClassReminderEmailProps) {
  return (
    <EmailLayout preview={`Reminder: ${className} starts soon`}>
      <Text
        style={{
          ...headingStyle,
          fontSize: "24px",
          lineHeight: "1.3",
          marginBottom: "24px",
        }}
      >
        Your class is starting soon
      </Text>

      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        This is a reminder that <strong>{className}</strong> begins at {classTime}.
      </Text>

      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "24px 28px",
          margin: "8px 0 28px",
          textAlign: "center",
        }}
      >
        <Link href={joinLink} style={buttonStyle}>
          Join Class
        </Link>
      </Section>

      <Hr style={dividerStyle} />
      <Text style={mutedTextStyle}>
        The studio opens around {preJoinWindowLabel} before class. If this is your first join for
        the session, please arrive before the {lateJoinCutoffLabel} warm-up cutoff.
      </Text>
    </EmailLayout>
  );
}
