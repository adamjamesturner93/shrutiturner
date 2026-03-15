import { Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, buttonStyle, colors, headingStyle, mutedTextStyle } from "./styles";

interface GiftRedemptionEmailProps {
  recipientName: string;
  purchaserName: string;
  productTitle: string;
  giftMessage?: string | null;
  redemptionUrl: string;
  sendToBuyer?: boolean;
}

export default function GiftRedemptionEmail({
  recipientName,
  purchaserName,
  productTitle,
  giftMessage,
  redemptionUrl,
  sendToBuyer = false,
}: GiftRedemptionEmailProps) {
  return (
    <EmailLayout
      preview={
        sendToBuyer
          ? `Your gift for ${productTitle} is ready to forward`
          : `${purchaserName} has sent you a gift`
      }
    >
      <Text style={headingStyle}>
        {sendToBuyer ? "Your gift is ready to share." : `A gift from ${purchaserName}.`}
      </Text>

      <Text style={bodyTextStyle}>
        {sendToBuyer
          ? `You bought a gift for ${productTitle}. Use the link below when you're ready to send it on to ${recipientName}.`
          : `${purchaserName} has gifted you ${productTitle}.`}
      </Text>

      {giftMessage ? (
        <Section
          style={{
            backgroundColor: colors.secondaryBg,
            borderRadius: "8px",
            padding: "24px",
            margin: "20px 0",
          }}
        >
          <Text style={{ ...mutedTextStyle, margin: 0 }}>{giftMessage}</Text>
        </Section>
      ) : null}

      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Link href={redemptionUrl} style={buttonStyle}>
          {sendToBuyer ? "Open gift link" : "Redeem your gift"}
        </Link>
      </Section>

      <Text style={mutedTextStyle}>
        {sendToBuyer
          ? "This link reserves the gifted place and can be forwarded whenever you're ready."
          : "You'll be guided through the next steps after signing in or creating an account."}
      </Text>
    </EmailLayout>
  );
}
