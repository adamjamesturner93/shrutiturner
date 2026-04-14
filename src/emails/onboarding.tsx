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

interface OnboardingEmailProps {
  firstName?: string;
  membershipUrl?: string;
  scheduleUrl?: string;
  freeTrialDays?: string;
}

export default function OnboardingEmail({
  firstName = "there",
  membershipUrl = "https://shrutiturner.co.uk/pricing",
  scheduleUrl = "https://shrutiturner.co.uk/schedule",
  freeTrialDays = "7",
}: OnboardingEmailProps) {
  return (
    <EmailLayout preview={`Getting the most from your account, ${firstName}`}>
      <Text
        style={{
          ...headingStyle,
          fontSize: "26px",
          lineHeight: "1.2",
          marginBottom: "24px",
        }}
      >
        Make the most of your practice
      </Text>

      <Text style={bodyTextStyle}>Hi {firstName},</Text>

      <Text style={bodyTextStyle}>
        {"You've"} been here for a few days now, and I wanted to share a few things that will help
        you get the most out of your account.
      </Text>

      {/* Step Cards */}
      <Section
        style={{
          marginTop: "8px",
          marginBottom: "8px",
        }}
      >
        {/* Step 1 */}
        <Section
          style={{
            backgroundColor: "#ffffff",
            border: `1px solid ${colors.border}`,
            borderRadius: "8px",
            padding: "24px 24px",
            marginBottom: "12px",
          }}
        >
          <Text
            style={{
              fontFamily: fonts.body,
              color: colors.brandAccent,
              fontSize: "12px",
              fontWeight: "600",
              textTransform: "uppercase" as const,
              letterSpacing: "0.06em",
              margin: "0 0 8px 0",
            }}
          >
            Step 1
          </Text>
          <Text
            style={{
              ...headingStyle,
              fontSize: "18px",
              marginBottom: "8px",
            }}
          >
            Try a free membership trial
          </Text>
          <Text
            style={{
              ...bodyTextStyle,
              fontSize: "15px",
              color: colors.muted,
              marginBottom: "16px",
            }}
          >
            Get {freeTrialDays} days of full access to every class — no commitment needed. {"It's"}{" "}
            the best way to see what works for your body.
          </Text>
          <Link
            href={membershipUrl}
            style={{
              fontFamily: fonts.body,
              color: colors.brandAccent,
              fontSize: "15px",
              fontWeight: "500",
              textDecoration: "underline",
            }}
          >
            {"Start your free trial \u2192"}
          </Link>
        </Section>

        {/* Step 2 */}
        <Section
          style={{
            backgroundColor: "#ffffff",
            border: `1px solid ${colors.border}`,
            borderRadius: "8px",
            padding: "24px 24px",
            marginBottom: "12px",
          }}
        >
          <Text
            style={{
              fontFamily: fonts.body,
              color: colors.brandAccent,
              fontSize: "12px",
              fontWeight: "600",
              textTransform: "uppercase" as const,
              letterSpacing: "0.06em",
              margin: "0 0 8px 0",
            }}
          >
            Step 2
          </Text>
          <Text
            style={{
              ...headingStyle,
              fontSize: "18px",
              marginBottom: "8px",
            }}
          >
            View the schedule
          </Text>
          <Text
            style={{
              ...bodyTextStyle,
              fontSize: "15px",
              color: colors.muted,
              marginBottom: "16px",
            }}
          >
            Browse upcoming classes by type, time, and level. Whether you prefer morning flow or an
            evening stretch, {"there's"} something that fits.
          </Text>
          <Link
            href={scheduleUrl}
            style={{
              fontFamily: fonts.body,
              color: colors.brandAccent,
              fontSize: "15px",
              fontWeight: "500",
              textDecoration: "underline",
            }}
          >
            {"See what\u2019s coming up \u2192"}
          </Link>
        </Section>

        {/* Step 3 */}
        <Section
          style={{
            backgroundColor: "#ffffff",
            border: `1px solid ${colors.border}`,
            borderRadius: "8px",
            padding: "24px 24px",
            marginBottom: "12px",
          }}
        >
          <Text
            style={{
              fontFamily: fonts.body,
              color: colors.brandAccent,
              fontSize: "12px",
              fontWeight: "600",
              textTransform: "uppercase" as const,
              letterSpacing: "0.06em",
              margin: "0 0 8px 0",
            }}
          >
            Step 3
          </Text>
          <Text
            style={{
              ...headingStyle,
              fontSize: "18px",
              marginBottom: "8px",
            }}
          >
            Book your first class
          </Text>
          <Text
            style={{
              ...bodyTextStyle,
              fontSize: "15px",
              color: colors.muted,
              marginBottom: "16px",
            }}
          >
            Found something you like? Book straight from the schedule — {"you'll"}
            get a confirmation email with everything you need to know.
          </Text>
          <Link
            href={scheduleUrl}
            style={{
              fontFamily: fonts.body,
              color: colors.brandAccent,
              fontSize: "15px",
              fontWeight: "500",
              textDecoration: "underline",
            }}
          >
            {"Book a class \u2192"}
          </Link>
        </Section>
      </Section>

      <Section style={{ textAlign: "center" as const, marginTop: "20px", marginBottom: "28px" }}>
        <Link href={scheduleUrl} style={buttonStyle}>
          Explore classes
        </Link>
      </Section>

      <Hr style={dividerStyle} />

      <Text style={{ ...mutedTextStyle, fontSize: "14px" }}>
        If you have any questions about classes, membership, or just want some guidance on where to
        start — simply reply to this email. {"I'm"} here to help.
      </Text>

      <Text style={{ ...bodyTextStyle, marginTop: "24px" }}>
        With warmth,
        <br />
        Shruti
      </Text>
    </EmailLayout>
  );
}
