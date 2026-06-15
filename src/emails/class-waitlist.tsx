import { Hr, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import {
  bodyTextStyle,
  buttonStyle,
  colors,
  dividerStyle,
  fonts,
  headingStyle,
  mutedTextStyle,
} from "./styles";

interface ClassWaitlistEmailProps {
  firstName?: string;
  className?: string;
  classDate?: string;
  classTime?: string;
  classDuration?: string;
  manageBookingUrl?: string;
  position?: number;
  variant?: "joined" | "promoted";
}

export default function ClassWaitlistEmail({
  firstName = "there",
  className = "Strength & Flow",
  classDate = "Thursday, 6 March 2026",
  classTime = "9:30 AM",
  classDuration = "60 minutes",
  manageBookingUrl = "https://shrutiturner.co.uk/dashboard/schedule",
  position,
  variant = "joined",
}: ClassWaitlistEmailProps) {
  const isPromoted = variant === "promoted";
  const title = isPromoted ? "Your waitlist spot is confirmed." : "You're on the waitlist.";
  const preview = isPromoted
    ? `Your spot is confirmed for ${className}`
    : `You are on the waitlist for ${className}`;

  return (
    <EmailLayout preview={preview}>
      <Text
        style={{
          ...headingStyle,
          fontSize: "24px",
          lineHeight: "1.3",
          marginBottom: "8px",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          ...mutedTextStyle,
          fontSize: "15px",
          marginBottom: "24px",
        }}
      >
        {isPromoted
          ? "A space opened up, so your place is now booked."
          : "If a space opens, your booking will be confirmed automatically."}
      </Text>

      <Text style={bodyTextStyle}>Hi {firstName},</Text>

      <Text style={bodyTextStyle}>
        {isPromoted
          ? "You have been moved from the waitlist into the class."
          : "You have joined the waitlist for this class."}
      </Text>

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

        {[
          { label: "Date", value: classDate },
          { label: "Time", value: classTime },
          { label: "Duration", value: classDuration },
          !isPromoted && position ? { label: "Waitlist position", value: `#${position}` } : null,
        ]
          .filter((item): item is { label: string; value: string } => Boolean(item))
          .map((item) => (
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

      <Section style={{ textAlign: "center" as const, marginBottom: "8px" }}>
        <Link href={manageBookingUrl} style={buttonStyle}>
          View your schedule
        </Link>
      </Section>

      <Hr style={dividerStyle} />

      <Text style={mutedTextStyle}>
        {isPromoted
          ? "You can manage or cancel this booking from your dashboard."
          : "No credit is used unless you are moved into the class."}
      </Text>

      <Text style={{ ...bodyTextStyle, marginTop: "24px" }}>
        See you soon,
        <br />
        Shruti
      </Text>
    </EmailLayout>
  );
}
