import { Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, buttonStyle, headingStyle, mutedTextStyle } from "./styles";

type RetreatPaymentReceiptEmailProps = {
  firstName: string;
  retreatName: string;
  retreatDates: string;
  amountPaid: string;
  totalPaid: string;
  retreatDetailsUrl: string;
};

export default function RetreatPaymentReceiptEmail({
  firstName,
  retreatName,
  retreatDates,
  amountPaid,
  totalPaid,
  retreatDetailsUrl,
}: RetreatPaymentReceiptEmailProps) {
  return (
    <EmailLayout preview={`Payment received for ${retreatName}`}>
      <Text style={{ ...headingStyle, fontSize: "24px", lineHeight: "1.3" }}>
        Your retreat balance is paid.
      </Text>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Thank you. Your payment of {amountPaid} for {retreatName} has been received.
      </Text>
      <Section style={{ margin: "24px 0", padding: "20px", border: "1px solid #deddd8" }}>
        <Text style={{ ...bodyTextStyle, margin: "0 0 8px" }}>{retreatDates}</Text>
        <Text style={{ ...mutedTextStyle, margin: "0" }}>Total paid: {totalPaid}</Text>
      </Section>
      <Section style={{ textAlign: "center" }}>
        <Link href={retreatDetailsUrl} style={buttonStyle}>
          View retreat details
        </Link>
      </Section>
    </EmailLayout>
  );
}
