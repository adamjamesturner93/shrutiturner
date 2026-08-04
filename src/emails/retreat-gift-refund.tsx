import { Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, headingStyle, mutedTextStyle } from "./styles";

type RetreatGiftRefundEmailProps = {
  firstName: string;
  retreatName: string;
  refundAmount: string;
};

export default function RetreatGiftRefundEmail({
  firstName,
  retreatName,
  refundAmount,
}: RetreatGiftRefundEmailProps) {
  return (
    <EmailLayout preview={`Gift purchase refund for ${retreatName}`}>
      <Text style={{ ...headingStyle, fontSize: "24px", lineHeight: "1.3" }}>
        Your gift purchase has been cancelled.
      </Text>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Your unredeemed gift purchase for {retreatName} has been cancelled. A refund of{" "}
        {refundAmount} has been submitted to your original payment method.
      </Text>
      <Text style={mutedTextStyle}>
        Your bank may take several working days to show the refund.
      </Text>
    </EmailLayout>
  );
}
