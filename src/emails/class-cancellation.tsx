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

interface ClassCancellationEmailProps {
  firstName?: string;
  className?: string;
  classDate?: string;
  classTime?: string;
  cancellationReason?: string;
  alternativeClassUrl?: string;
}

export default function ClassCancellationEmail({
  firstName = "there",
  className = "Strength & Flow",
  classDate = "Thursday, 6 March 2026",
  classTime = "9:30 AM",
  cancellationReason = "Unfortunately, I need to cancel this session due to unforeseen circumstances. I'm sorry for the inconvenience and hope to see you at a future class soon.",
  alternativeClassUrl = "https://shrutiturner.com/classes",
}: ClassCancellationEmailProps) {
  return (
    <EmailLayout preview={`Class cancelled: ${className} on ${classDate}`}>
      <Text
        style={{
          ...headingStyle,
          fontSize: "24px",
          lineHeight: "1.3",
          marginBottom: "24px",
        }}
      >
        Class cancelled
      </Text>

      <Text style={bodyTextStyle}>
        Hi {firstName},
      </Text>

      <Text style={bodyTextStyle}>
        {"I'm writing to let you know that the following class has been cancelled:"}
      </Text>

      {/* Cancelled Class Card */}
      <Section
        style={{
          backgroundColor: "#fdf6f4",
          borderRadius: "8px",
          padding: "24px 28px",
          margin: "8px 0 28px",
          borderLeft: `3px solid #d4183d`,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.heading,
            color: colors.brandDark,
            fontSize: "18px",
            fontWeight: "700",
            margin: "0 0 12px 0",
            textDecoration: "line-through",
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
            textDecoration: "line-through",
          }}
        >
          {classDate} at {classTime}
        </Text>
      </Section>

      {/* Reason */}
      <Section
        style={{
          borderLeft: `3px solid ${colors.brandAccentLight}`,
          paddingLeft: "20px",
          marginBottom: "28px",
        }}
      >
        <Text
          style={{
            fontFamily: fonts.body,
            color: colors.brandDark,
            fontSize: "15px",
            fontStyle: "italic",
            lineHeight: "1.6",
            margin: "0",
          }}
        >
          {cancellationReason}
        </Text>
      </Section>

      <Text style={bodyTextStyle}>
        {"If you'd like to book into another session, you can find all available classes here:"}
      </Text>

      <Section style={{ textAlign: "center" as const, marginBottom: "8px" }}>
        <Link href={alternativeClassUrl} style={buttonStyle}>
          View available classes
        </Link>
      </Section>

      <Hr style={dividerStyle} />

      <Text style={mutedTextStyle}>
        Any payments or credits for this class will be automatically refunded or returned to your account.
      </Text>

      <Text style={{ ...bodyTextStyle, marginTop: "24px" }}>
        Apologies again, and thank you for understanding.
        <br />
        <br />
        Shruti
      </Text>
    </EmailLayout>
  );
}
