import { Section, Text, Link, Hr } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import {
  colors,
  headingStyle,
  bodyTextStyle,
  mutedTextStyle,
  buttonStyle,
  dividerStyle,
} from "./styles";

interface PurchaseConfirmationEmailProps {
  firstName?: string;
  purchaseDescription?: string;
  amount?: string;
  date?: string;
  invoiceId?: string;
  accountUrl?: string;
}

export default function PurchaseConfirmationEmail({
  firstName = "there",
  purchaseDescription = "Purchase",
  amount = "£90.00",
  date = "March 15, 2026",
  invoiceId = "INV-12345678",
  accountUrl = "https://shrutiturner.co.uk/dashboard",
}: PurchaseConfirmationEmailProps) {
  return (
    <EmailLayout preview={`Receipt for ${purchaseDescription}`}>
      <Text
        style={{
          ...headingStyle,
          fontSize: "24px",
          lineHeight: "1.3",
          marginBottom: "24px",
        }}
      >
        Payment received
      </Text>

      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Thank you for your purchase. Here is a receipt summary for your records.
      </Text>

      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "24px 28px",
          margin: "8px 0 28px",
        }}
      >
        <Text style={{ ...bodyTextStyle, marginBottom: "8px" }}>
          <strong>Item:</strong> {purchaseDescription}
        </Text>
        <Text style={{ ...bodyTextStyle, marginBottom: "8px" }}>
          <strong>Date:</strong> {date}
        </Text>
        <Text style={{ ...bodyTextStyle, marginBottom: "8px" }}>
          <strong>Invoice:</strong> {invoiceId}
        </Text>
        <Text style={{ ...bodyTextStyle, marginBottom: "0" }}>
          <strong>Total:</strong> {amount}
        </Text>
      </Section>

      <Section style={{ textAlign: "center", marginBottom: "16px" }}>
        <Link href={accountUrl} style={buttonStyle}>
          View your account
        </Link>
      </Section>

      <Hr style={dividerStyle} />
      <Text style={mutedTextStyle}>Your purchase has been applied to your account.</Text>
    </EmailLayout>
  );
}
