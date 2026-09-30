import { Heading, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, buttonStyle, colors, headingStyle, mutedTextStyle } from "./styles";

export default function RetreatLiveReminderEmail({
  firstName,
  retreatName,
  dateTime,
  reminderLabel,
  joinUrl,
  calendarUrl,
}: {
  firstName: string;
  retreatName: string;
  dateTime: string;
  reminderLabel: string;
  joinUrl: string;
  calendarUrl: string;
}) {
  return (
    <EmailLayout preview={`${retreatName} begins ${reminderLabel}`}>
      <Heading as="h1" style={{ ...headingStyle, fontSize: "24px", lineHeight: "1.3" }}>
        Your online retreat begins {reminderLabel}
      </Heading>
      <Text style={bodyTextStyle}>Hi {firstName || "there"},</Text>
      <Text style={bodyTextStyle}>
        <strong>{retreatName}</strong> begins {dateTime}. Use the secure studio link below to check
        your camera and microphone and join when the host opens the room.
      </Text>
      <Section style={{ margin: "28px 0", textAlign: "center" }}>
        <Link href={joinUrl} style={buttonStyle}>
          Open retreat
        </Link>
      </Section>
      <Text style={mutedTextStyle}>
        <Link href={calendarUrl} style={{ color: colors.brandAccent, textDecoration: "underline" }}>
          Add or update the calendar event
        </Link>
        . This link opens your website account; the Daily room address is never sent by email.
      </Text>
    </EmailLayout>
  );
}
