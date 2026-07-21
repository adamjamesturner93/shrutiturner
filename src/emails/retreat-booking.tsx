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

interface RetreatBookingEmailProps {
  firstName?: string;
  retreatName?: string;
  retreatDates?: string;
  retreatLocation?: string;
  depositAmount?: string;
  totalPrice?: string;
  remainderAmount?: string;
  remainderDueDate?: string;
  retreatDetailsUrl?: string;
  transactionRef?: string;
  paidInFull?: boolean;
}

export default function RetreatBookingEmail({
  firstName = "there",
  retreatName = "Rest & Restore: A Weekend Retreat in the Cotswolds",
  retreatDates = "18 - 20 September 2026",
  retreatLocation = "Meadow House, Cirencester, Cotswolds",
  depositAmount = "\u00a3150.00",
  totalPrice = "\u00a3595.00",
  remainderAmount = "\u00a3445.00",
  remainderDueDate = "18 August 2026",
  retreatDetailsUrl = "https://shrutiturner.co.uk/retreats/rest-and-restore",
  transactionRef = "RT-2026-0342",
  paidInFull = false,
}: RetreatBookingEmailProps) {
  const paymentRows = [
    { label: "Total retreat price", value: totalPrice },
    {
      label: paidInFull ? "Paid in full" : "Deposit paid",
      value: paidInFull ? totalPrice : depositAmount,
      highlight: true,
    },
    ...(paidInFull
      ? []
      : [
          { label: "Remainder due", value: remainderAmount },
          { label: "Due by", value: remainderDueDate },
        ]),
    { label: "Reference", value: transactionRef },
  ];

  return (
    <EmailLayout
      preview={
        paidInFull
          ? `Retreat payment received: ${retreatName}`
          : `Retreat deposit received: ${retreatName}`
      }
    >
      <Text
        style={{
          ...headingStyle,
          fontSize: "24px",
          lineHeight: "1.3",
          marginBottom: "8px",
        }}
      >
        Your retreat place is secured.
      </Text>
      <Text
        style={{
          ...mutedTextStyle,
          fontSize: "15px",
          marginBottom: "24px",
        }}
      >
        {paidInFull
          ? "Payment received — you're confirmed."
          : "Deposit received — you're confirmed."}
      </Text>

      <Text style={bodyTextStyle}>Hi {firstName},</Text>

      <Text style={bodyTextStyle}>
        {paidInFull
          ? "Wonderful news — your payment has been received and your place on the retreat is now secured. I'm so pleased you'll be joining."
          : "Wonderful news — your deposit has been received and your place on the retreat is now secured. I'm so pleased you'll be joining."}
      </Text>

      {/* Retreat Details Card */}
      <Section
        style={{
          backgroundColor: colors.brandAccent,
          borderRadius: "8px",
          padding: "32px 28px",
          margin: "8px 0 0",
        }}
      >
        <Text
          style={{
            fontFamily: fonts.heading,
            color: colors.brandWhite,
            fontSize: "20px",
            fontWeight: "700",
            lineHeight: "1.3",
            margin: "0 0 20px 0",
          }}
        >
          {retreatName}
        </Text>

        {[
          { label: "Dates", value: retreatDates },
          { label: "Location", value: retreatLocation },
        ].map((item) => (
          <Section key={item.label} style={{ marginBottom: "12px" }}>
            <Text
              style={{
                fontFamily: fonts.body,
                color: colors.brandAccentLight,
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
                color: colors.brandWhite,
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

      {/* Payment Summary Card */}
      <Section
        style={{
          backgroundColor: "#ffffff",
          border: `1px solid ${colors.border}`,
          borderRadius: "0 0 8px 8px",
          padding: "28px",
          marginBottom: "28px",
        }}
      >
        <Text
          style={{
            fontFamily: fonts.body,
            color: colors.muted,
            fontSize: "12px",
            textTransform: "uppercase" as const,
            letterSpacing: "0.06em",
            fontWeight: "600",
            margin: "0 0 16px 0",
          }}
        >
          Payment Summary
        </Text>

        {/* Row items */}
        {paymentRows.map((item, i) => (
          <Section
            key={item.label}
            style={{
              display: "flex",
              marginBottom: i < paymentRows.length - 1 ? "10px" : "0",
              paddingBottom: i < paymentRows.length - 1 ? "10px" : "0",
              borderBottom: i < paymentRows.length - 1 ? `1px solid ${colors.border}` : "none",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body,
                color: colors.muted,
                fontSize: "14px",
                margin: "0",
                display: "inline" as const,
              }}
            >
              {item.label}
            </Text>
            <Text
              style={{
                fontFamily: fonts.body,
                color: item.highlight ? colors.brandAccent : colors.brandDark,
                fontSize: "14px",
                fontWeight: item.highlight ? "600" : "500",
                margin: "0 0 0 auto",
                textAlign: "right" as const,
              }}
            >
              {item.value}
            </Text>
          </Section>
        ))}
      </Section>

      <Section style={{ textAlign: "center" as const, marginBottom: "8px" }}>
        <Link href={retreatDetailsUrl} style={buttonStyle}>
          View retreat details
        </Link>
      </Section>

      <Hr style={dividerStyle} />

      <Text style={mutedTextStyle}>
        {
          "I'll be in touch closer to the date with full joining instructions, including what to bring and how to get there."
        }
      </Text>

      <Text style={{ ...bodyTextStyle, marginTop: "24px" }}>
        So looking forward to this,
        <br />
        Shruti
      </Text>
    </EmailLayout>
  );
}
