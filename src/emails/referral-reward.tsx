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

interface ReferralRewardEmailProps {
  firstName?: string;
  referredName?: string;
  creditAmount?: string;
  totalCredits?: string;
  scheduleUrl?: string;
  referralUrl?: string;
}

export default function ReferralRewardEmail({
  firstName = "there",
  referredName = "Emma",
  creditAmount = "\u00a310",
  totalCredits = "\u00a310",
  scheduleUrl = "https://shrutiturner.co.uk/schedule",
  referralUrl = "https://shrutiturner.co.uk/referral",
}: ReferralRewardEmailProps) {
  return (
    <EmailLayout preview={`${referredName} signed up — you've earned ${creditAmount} credit!`}>
      <Text
        style={{
          ...headingStyle,
          fontSize: "26px",
          lineHeight: "1.2",
          marginBottom: "24px",
        }}
      >
        Your referral just signed up
      </Text>

      <Text style={bodyTextStyle}>Hi {firstName},</Text>

      <Text style={bodyTextStyle}>
        Great news — <strong>{referredName}</strong> has signed up using your referral link and{" "}
        {"we've"} added <strong>{creditAmount} credit</strong> to your account as a thank you.
      </Text>

      {/* Reward Card */}
      <Section
        style={{
          backgroundColor: colors.brandAccent,
          borderRadius: "8px",
          padding: "32px 28px",
          marginTop: "8px",
          marginBottom: "28px",
          textAlign: "center" as const,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.body,
            color: colors.brandAccentLight,
            fontSize: "12px",
            textTransform: "uppercase" as const,
            letterSpacing: "0.08em",
            fontWeight: "600",
            margin: "0 0 8px 0",
          }}
        >
          Credit added
        </Text>
        <Text
          style={{
            fontFamily: fonts.heading,
            color: colors.brandWhite,
            fontSize: "42px",
            fontWeight: "700",
            margin: "0 0 8px 0",
            lineHeight: "1",
          }}
        >
          {creditAmount}
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            color: "rgba(250, 250, 248, 0.75)",
            fontSize: "14px",
            margin: "0",
          }}
        >
          Your total credit balance:{" "}
          <strong style={{ color: colors.brandWhite }}>{totalCredits}</strong>
        </Text>
      </Section>

      <Text style={bodyTextStyle}>
        This retired template is kept for historical reference and should not be used for live
        sends.
      </Text>

      <Section style={{ textAlign: "center" as const, marginBottom: "28px" }}>
        <Link href={scheduleUrl} style={buttonStyle}>
          Contact Shruti
        </Link>
      </Section>

      <Hr style={dividerStyle} />

      {/* Share Again */}
      <Text
        style={{
          ...headingStyle,
          fontSize: "18px",
          marginBottom: "12px",
        }}
      >
        Keep sharing the love
      </Text>

      <Text style={{ ...bodyTextStyle, fontSize: "15px" }}>
        Every time someone signs up with your link, you both benefit. Share your unique link to earn
        more credit:
      </Text>

      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "6px",
          padding: "16px 20px",
          marginBottom: "24px",
        }}
      >
        <Text
          style={{
            fontFamily: fonts.body,
            color: colors.brandAccent,
            fontSize: "14px",
            fontWeight: "500",
            margin: "0",
            wordBreak: "break-all" as const,
          }}
        >
          {referralUrl}
        </Text>
      </Section>

      <Text style={{ ...mutedTextStyle, fontSize: "14px" }}>
        Thank you for spreading the word — it means more than you know.
      </Text>

      <Text style={{ ...bodyTextStyle, marginTop: "24px" }}>
        With gratitude,
        <br />
        Shruti
      </Text>
    </EmailLayout>
  );
}
