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

interface ClassBookingEmailProps {
  firstName?: string;
  className?: string;
  classDate?: string;
  classTime?: string;
  classDuration?: string;
  classLocation?: string;
  instructorNote?: string;
  manageBookingUrl?: string;
  creditRefundWindowLabel?: string;
  preJoinWindowLabel?: string;
  lateJoinCutoffLabel?: string;
}

export default function ClassBookingEmail({
  firstName = "there",
  className = "Strength & Flow",
  classDate = "Thursday, 6 March 2026",
  classTime = "9:30 AM",
  classDuration = "60 minutes",
  classLocation = "Private Studio (online)",
  instructorNote = "No special equipment needed for this session — just a mat and yourself. We'll be working on building capacity through slow, intentional movement.",
  manageBookingUrl = "https://shrutiturner.co.uk/account/bookings",
  creditRefundWindowLabel = "3 hours",
  preJoinWindowLabel = "10 minutes",
  lateJoinCutoffLabel = "5 minutes",
}: ClassBookingEmailProps) {
  return (
    <EmailLayout preview={`Booking confirmed: ${className} on ${classDate}`}>
      <Text
        style={{
          ...headingStyle,
          fontSize: "24px",
          lineHeight: "1.3",
          marginBottom: "8px",
        }}
      >
        {"You're booked in."}
      </Text>
      <Text
        style={{
          ...mutedTextStyle,
          fontSize: "15px",
          marginBottom: "24px",
        }}
      >
        Your spot is confirmed for the class below.
      </Text>

      <Text style={bodyTextStyle}>Hi {firstName},</Text>

      <Text style={bodyTextStyle}>
        {"Great news — your booking is confirmed. Here are the details:"}
      </Text>

      {/* Class Details Card */}
      <Section
        style={{
          backgroundColor: "#ffffff",
          border: `1px solid ${colors.border}`,
          borderRadius: "8px",
          padding: "28px",
          margin: "8px 0 28px",
        }}
      >
        <Text
          style={{
            fontFamily: fonts.heading,
            color: colors.brandDark,
            fontSize: "20px",
            fontWeight: "700",
            margin: "0 0 20px 0",
          }}
        >
          {className}
        </Text>

        {/* Detail rows */}
        {[
          { label: "Date", value: classDate },
          { label: "Time", value: classTime },
          { label: "Duration", value: classDuration },
          { label: "Location", value: classLocation },
        ].map((item) => (
          <Section key={item.label} style={{ marginBottom: "12px" }}>
            <Text
              style={{
                fontFamily: fonts.body,
                color: colors.muted,
                fontSize: "12px",
                textTransform: "uppercase" as const,
                letterSpacing: "0.06em",
                fontWeight: "600",
                margin: "0 0 2px 0",
              }}
            >
              {item.label}
            </Text>
            <Text
              style={{
                fontFamily: fonts.body,
                color: colors.brandDark,
                fontSize: "16px",
                fontWeight: "500",
                margin: "0",
              }}
            >
              {item.value}
            </Text>
          </Section>
        ))}
      </Section>

      {instructorNote && (
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
            {instructorNote}
          </Text>
        </Section>
      )}

      <Section style={{ textAlign: "center" as const, marginBottom: "8px" }}>
        <Link href={manageBookingUrl} style={buttonStyle}>
          Manage your booking
        </Link>
      </Section>

      <Hr style={dividerStyle} />

      <Text style={mutedTextStyle}>
        Need to cancel? You can do so up to {creditRefundWindowLabel} before the class starts from
        your account dashboard.
      </Text>
      <Text style={mutedTextStyle}>
        The online studio opens {preJoinWindowLabel} before class. First-time joins close{" "}
        {lateJoinCutoffLabel} after the start time so everyone has the warm-up context.
      </Text>

      <Text style={{ ...bodyTextStyle, marginTop: "24px" }}>
        See you on the mat,
        <br />
        Shruti
      </Text>
    </EmailLayout>
  );
}
