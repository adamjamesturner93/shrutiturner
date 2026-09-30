import { Heading, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, buttonStyle, colors, headingStyle, mutedTextStyle } from "./styles";

export default function ProgrammeUpdateEmail({
  programmeTitle,
  message,
  actionUrl,
  actionLabel,
  calendarUrl,
  onboardingUrl,
}: {
  programmeTitle: string;
  message: string;
  actionUrl: string;
  actionLabel: string;
  calendarUrl?: string;
  onboardingUrl?: string;
}) {
  return (
    <EmailLayout preview={message}>
      <Heading as="h1" style={headingStyle}>
        {programmeTitle}
      </Heading>
      <Text style={bodyTextStyle}>{message}</Text>
      <Section style={{ margin: "28px 0" }}>
        <Link href={actionUrl} style={buttonStyle}>
          {actionLabel}
        </Link>
      </Section>
      {onboardingUrl ? (
        <Text style={mutedTextStyle}>
          <Link
            href={onboardingUrl}
            style={{ color: colors.brandAccent, textDecoration: "underline" }}
          >
            Review your programme setup
          </Link>
        </Text>
      ) : null}
      {calendarUrl ? (
        <Text style={mutedTextStyle}>
          <Link
            href={calendarUrl}
            style={{ color: colors.brandAccent, textDecoration: "underline" }}
          >
            Add sessions to your calendar
          </Link>
        </Text>
      ) : null}
    </EmailLayout>
  );
}
