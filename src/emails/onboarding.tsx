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
  offersUrl?: string;
  applyUrl?: string;
  dashboardUrl?: string;
  healthUrl?: string;
  hasOneToOneApplication?: boolean;
}

export default function OnboardingEmail({
  firstName = "there",
  offersUrl = "https://shrutiturner.co.uk/coaching",
  applyUrl = "https://shrutiturner.co.uk/coaching/apply",
  dashboardUrl = "https://shrutiturner.co.uk/dashboard/coaching",
  healthUrl = "https://shrutiturner.co.uk/dashboard/health",
  hasOneToOneApplication = false,
}: OnboardingEmailProps) {
  const preview = hasOneToOneApplication
    ? `Your account is ready, ${firstName} — you can now track your 1:1 application`
    : `Your account is ready, ${firstName}`;

  return (
    <EmailLayout preview={preview}>
      <Text
        style={{
          ...headingStyle,
          fontSize: "26px",
          lineHeight: "1.2",
          marginBottom: "24px",
        }}
      >
        Your studio account is ready
      </Text>

      <Text style={bodyTextStyle}>Hi {firstName},</Text>

      {hasOneToOneApplication ? (
        <Text style={bodyTextStyle}>
          Your account is now set up, so you can use your dashboard to track your 1:1 application,
          payment invitations, health details and account information in one place.
        </Text>
      ) : (
        <Text style={bodyTextStyle}>
          Your account is now set up. You can use it to manage your health details, account
          information and any future 1:1 application or payment invitation.
        </Text>
      )}

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
            {hasOneToOneApplication ? "Open your 1:1 dashboard" : "Explore 1:1 offers"}
          </Text>
          <Text
            style={{
              ...bodyTextStyle,
              fontSize: "15px",
              color: colors.muted,
              marginBottom: "16px",
            }}
          >
            {hasOneToOneApplication
              ? "Your dashboard shows your application status and the next action when there is one."
              : "Review the current 1:1 offers and the kind of support each one offers before you enquire."}
          </Text>
          <Link
            href={hasOneToOneApplication ? dashboardUrl : offersUrl}
            style={{
              fontFamily: fonts.body,
              color: colors.brandAccent,
              fontSize: "15px",
              fontWeight: "500",
              textDecoration: "underline",
            }}
          >
            {hasOneToOneApplication ? "Open dashboard \u2192" : "Compare options \u2192"}
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
            {hasOneToOneApplication ? "Keep your details current" : "Enquire before payment"}
          </Text>
          <Text
            style={{
              ...bodyTextStyle,
              fontSize: "15px",
              color: colors.muted,
              marginBottom: "16px",
            }}
          >
            {hasOneToOneApplication
              ? "Health and account details help Shruti review suitability and support you safely."
              : "1:1 support starts with an application so Shruti can confirm the best fit before any payment opens."}
          </Text>
          <Link
            href={hasOneToOneApplication ? healthUrl : applyUrl}
            style={{
              fontFamily: fonts.body,
              color: colors.brandAccent,
              fontSize: "15px",
              fontWeight: "500",
              textDecoration: "underline",
            }}
          >
            {hasOneToOneApplication
              ? "Review health details \u2192"
              : "Enquire about 1:1 support \u2192"}
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
            {hasOneToOneApplication ? "Watch for Shruti's reply" : "Complete your account details"}
          </Text>
          <Text
            style={{
              ...bodyTextStyle,
              fontSize: "15px",
              color: colors.muted,
              marginBottom: "16px",
            }}
          >
            {hasOneToOneApplication
              ? "If your application is accepted, payment opens through the website after the relevant terms are accepted."
              : "If your application is accepted, payment happens through the website after you sign in and accept the relevant terms."}
          </Text>
          <Link
            href={hasOneToOneApplication ? dashboardUrl : applyUrl}
            style={{
              fontFamily: fonts.body,
              color: colors.brandAccent,
              fontSize: "15px",
              fontWeight: "500",
              textDecoration: "underline",
            }}
          >
            {hasOneToOneApplication
              ? "View application status \u2192"
              : "Open the application \u2192"}
          </Link>
        </Section>
      </Section>

      <Section style={{ textAlign: "center" as const, marginTop: "20px", marginBottom: "28px" }}>
        <Link href={hasOneToOneApplication ? dashboardUrl : applyUrl} style={buttonStyle}>
          {hasOneToOneApplication ? "Open your 1:1 dashboard" : "Enquire about 1:1 support"}
        </Link>
      </Section>

      <Hr style={dividerStyle} />

      <Text style={{ ...mutedTextStyle, fontSize: "14px" }}>
        If you have any questions about 1:1 offers, your application or where to start, simply reply
        to this email.
      </Text>

      <Text style={{ ...bodyTextStyle, marginTop: "24px" }}>
        Best,
        <br />
        Shruti
      </Text>
    </EmailLayout>
  );
}
