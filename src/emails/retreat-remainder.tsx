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

interface RetreatRemainderEmailProps {
  firstName?: string;
  retreatName?: string;
  retreatDates?: string;
  remainderAmount?: string;
  dueDate?: string;
  paymentUrl?: string;
  retreatDetailsUrl?: string;
}

export default function RetreatRemainderEmail({
  firstName = "there",
  retreatName = "Rest & Restore: A Weekend Retreat in the Cotswolds",
  retreatDates = "18 - 20 September 2026",
  remainderAmount = "\u00a3445.00",
  dueDate = "18 August 2026",
  paymentUrl,
  retreatDetailsUrl = "https://shrutiturner.co.uk/retreats/rest-and-restore",
}: RetreatRemainderEmailProps) {
  const balanceUrl = paymentUrl || retreatDetailsUrl;

  return (
    <EmailLayout preview={`Retreat balance due: ${remainderAmount} by ${dueDate}`}>
      <Text
        style={{
          ...headingStyle,
          fontSize: "24px",
          lineHeight: "1.3",
          marginBottom: "8px",
        }}
      >
        Retreat balance reminder
      </Text>
      <Text
        style={{
          ...mutedTextStyle,
          fontSize: "15px",
          marginBottom: "24px",
        }}
      >
        A friendly reminder about your remaining payment.
      </Text>

      <Text style={bodyTextStyle}>Hi {firstName},</Text>

      <Text style={bodyTextStyle}>
        Just a gentle reminder that the remaining balance for your upcoming retreat is due soon.{" "}
        {"Here's"} a summary:
      </Text>

      {/* Retreat Summary */}
      <Section
        style={{
          backgroundColor: "#ffffff",
          border: `1px solid ${colors.border}`,
          borderRadius: "8px",
          padding: "28px",
          margin: "8px 0 24px",
        }}
      >
        <Text
          style={{
            fontFamily: fonts.heading,
            color: colors.brandDark,
            fontSize: "18px",
            fontWeight: "700",
            lineHeight: "1.3",
            margin: "0 0 16px 0",
          }}
        >
          {retreatName}
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            color: colors.muted,
            fontSize: "15px",
            margin: "0 0 20px 0",
          }}
        >
          {retreatDates}
        </Text>

        <Hr style={{ borderColor: colors.border, margin: "0 0 20px 0" }} />

        <Section
          style={{
            backgroundColor: colors.brandAccent,
            borderRadius: "6px",
            padding: "20px 24px",
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
              margin: "0 0 4px 0",
            }}
          >
            Amount due
          </Text>
          <Text
            style={{
              fontFamily: fonts.heading,
              color: colors.brandWhite,
              fontSize: "32px",
              fontWeight: "700",
              margin: "0 0 4px 0",
              lineHeight: "1",
            }}
          >
            {remainderAmount}
          </Text>
          <Text
            style={{
              fontFamily: fonts.body,
              color: "rgba(250, 250, 248, 0.7)",
              fontSize: "14px",
              margin: "0",
            }}
          >
            Due by {dueDate}
          </Text>
        </Section>
      </Section>

      {/* Payment Link Card */}
      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "28px",
          margin: "0 0 28px",
        }}
      >
        <Text
          style={{
            fontFamily: fonts.body,
            color: colors.brandDark,
            fontSize: "14px",
            fontWeight: "600",
            textTransform: "uppercase" as const,
            letterSpacing: "0.06em",
            margin: "0 0 20px 0",
          }}
        >
          Payment Details
        </Text>
        <Text style={mutedTextStyle}>
          Use the secure payment link below to pay the remaining balance. If you have already paid,
          you can ignore this reminder.
        </Text>
        <Section style={{ textAlign: "center" as const, marginTop: "20px" }}>
          <Link href={balanceUrl} style={buttonStyle}>
            Pay remaining balance
          </Link>
        </Section>
      </Section>

      <Text style={bodyTextStyle}>
        {
          "If you've already made the payment, you can safely disregard this email. Otherwise, please ensure the balance is settled by"
        }{" "}
        <strong>{dueDate}</strong> to keep your place.
      </Text>

      <Section style={{ textAlign: "center" as const, marginBottom: "8px" }}>
        <Link href={retreatDetailsUrl} style={buttonStyle}>
          View retreat details
        </Link>
      </Section>

      <Hr style={dividerStyle} />

      <Text style={mutedTextStyle}>
        If you have any questions or need to discuss alternative payment arrangements, please{" "}
        {"don't"} hesitate to reply to this email.
      </Text>

      <Text style={{ ...bodyTextStyle, marginTop: "24px" }}>
        Best,
        <br />
        Shruti
      </Text>
    </EmailLayout>
  );
}
