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
}

export default function OnboardingEmail({
  firstName = "there",
  membershipUrl = "https://shrutiturner.co.uk/#work-with-me",
  scheduleUrl = "https://shrutiturner.co.uk/coaching/apply",
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
        Make the most of your 1:1 account
      </Text>

      <Text style={bodyTextStyle}>Hi {firstName},</Text>

      <Text style={bodyTextStyle}>
        {"You've"} been here for a few days now and I wanted to share a few things that will help
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
            Compare 1:1 offers
          </Text>
          <Text
            style={{
              ...bodyTextStyle,
              fontSize: "15px",
              color: colors.muted,
              marginBottom: "16px",
            }}
          >
            Review the current 1:1 offers and the kind of support each one offers before you apply.
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
            {"Compare options \u2192"}
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
            Apply before payment
          </Text>
          <Text
            style={{
              ...bodyTextStyle,
              fontSize: "15px",
              color: colors.muted,
              marginBottom: "16px",
            }}
          >
            1:1 support starts with an application so Shruti can confirm the best fit before any
            payment opens.
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
            {"Apply for 1:1 support \u2192"}
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
            Complete your account details
          </Text>
          <Text
            style={{
              ...bodyTextStyle,
              fontSize: "15px",
              color: colors.muted,
              marginBottom: "16px",
            }}
          >
            If your application is accepted, payment happens through the website after you sign in
            and accept the relevant terms.
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
            {"Open the application \u2192"}
          </Link>
        </Section>
      </Section>

      <Section style={{ textAlign: "center" as const, marginTop: "20px", marginBottom: "28px" }}>
        <Link href={scheduleUrl} style={buttonStyle}>
          Apply for 1:1 support
        </Link>
      </Section>

      <Hr style={dividerStyle} />

      <Text style={{ ...mutedTextStyle, fontSize: "14px" }}>
        If you have any questions about 1:1 offers or just want some guidance on where to start,
        simply reply to this email. {"I'm"} here to help.
      </Text>

      <Text style={{ ...bodyTextStyle, marginTop: "24px" }}>
        Best,
        <br />
        Shruti
      </Text>
    </EmailLayout>
  );
}
