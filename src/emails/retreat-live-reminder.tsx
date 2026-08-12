import { Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, buttonStyle, headingStyle, mutedTextStyle } from "./styles";

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
      <Text style={{ ...headingStyle, fontSize: "24px", lineHeight: "1.3" }}>
        Your online retreat begins {reminderLabel}
      </Text>
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
        <Link href={calendarUrl}>Add or update the calendar event</Link>. This link opens your
        website account; the Daily room address is never sent by email.
      </Text>
    </EmailLayout>
  );
}
