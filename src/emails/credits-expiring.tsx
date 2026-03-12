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

interface CreditsExpiringEmailProps {
  firstName?: string;
  creditCount?: string;
  expiryDate?: string;
  scheduleUrl?: string;
}

export default function CreditsExpiringEmail({
  firstName = "there",
  creditCount = "3",
  expiryDate = "18 March 2026",
  scheduleUrl = "https://shrutiturner.com/schedule",
}: CreditsExpiringEmailProps) {
  return (
    <EmailLayout preview={`Your credits expire on ${expiryDate} — use them before they go`}>
      <Text
        style={{
          ...headingStyle,
          fontSize: "26px",
          lineHeight: "1.2",
          marginBottom: "24px",
        }}
      >
        {"Don't let your credits slip away"}
      </Text>

      <Text style={bodyTextStyle}>
        Hi {firstName},
      </Text>

      <Text style={bodyTextStyle}>
        Just a gentle heads up — you have credits that are expiring soon. It would be a shame to lose them.
      </Text>

      {/* Credit Highlight Card */}
      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "28px 28px 24px",
          marginTop: "8px",
          marginBottom: "28px",
          textAlign: "center" as const,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.heading,
            color: colors.brandAccent,
            fontSize: "48px",
            fontWeight: "700",
            margin: "0 0 4px 0",
            lineHeight: "1",
          }}
        >
          {creditCount}
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            color: colors.muted,
            fontSize: "14px",
            textTransform: "uppercase" as const,
            letterSpacing: "0.06em",
            fontWeight: "500",
            margin: "0 0 4px 0",
          }}
        >
          {creditCount === "1" ? "credit remaining" : "credits remaining"}
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            color: colors.brandDark,
            fontSize: "15px",
            margin: "12px 0 0 0",
          }}
        >
          {"Expiring on "}
          <strong>{expiryDate}</strong>
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const, marginBottom: "28px" }}>
        <Link href={scheduleUrl} style={buttonStyle}>
          Browse the schedule
        </Link>
      </Section>

      <Hr style={dividerStyle} />

      <Text style={{ ...mutedTextStyle, fontSize: "14px" }}>
        Credits expire 14 days after your last session if not used. If {"you'd"} like to understand more about how credits work, just reply to this email and {"I'll"} be happy to help.
      </Text>

      <Text style={{ ...bodyTextStyle, marginTop: "24px" }}>
        See you on the mat,
        <br />
        Shruti
      </Text>
    </EmailLayout>
  );
}
