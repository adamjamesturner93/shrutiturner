import { Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, buttonStyle, headingStyle, mutedTextStyle } from "./styles";

type RetreatBookingAdminEmailProps = {
  purchaserName: string;
  purchaserEmail: string;
  retreatName: string;
  retreatDates: string;
  selection: string;
  guestCount: number;
  paymentSummary: string;
  adminUrl: string;
  isGift?: boolean;
  recipientEmail?: string | null;
};

export default function RetreatBookingAdminEmail({
  purchaserName,
  purchaserEmail,
  retreatName,
  retreatDates,
  selection,
  guestCount,
  paymentSummary,
  adminUrl,
  isGift = false,
  recipientEmail,
}: RetreatBookingAdminEmailProps) {
  return (
    <EmailLayout preview={`New ${isGift ? "gift purchase" : "booking"}: ${retreatName}`}>
      <Text style={{ ...headingStyle, fontSize: "24px", lineHeight: "1.3" }}>
        New retreat {isGift ? "gift purchase" : "booking"}
      </Text>
      <Text style={bodyTextStyle}>
        {purchaserName} ({purchaserEmail}) has {isGift ? "bought a gift" : "booked a place"} for{" "}
        {retreatName}.
      </Text>
      <Section style={{ margin: "24px 0", padding: "20px", border: "1px solid #deddd8" }}>
        <Text style={{ ...bodyTextStyle, margin: "0 0 8px" }}>{retreatDates}</Text>
        <Text style={{ ...mutedTextStyle, margin: "0 0 8px" }}>{selection}</Text>
        <Text style={{ ...mutedTextStyle, margin: "0 0 8px" }}>
          {guestCount} {guestCount === 1 ? "guest" : "guests"}
        </Text>
        {recipientEmail ? (
          <Text style={{ ...mutedTextStyle, margin: "0 0 8px" }}>
            Gift recipient: {recipientEmail}
          </Text>
        ) : null}
        <Text style={{ ...mutedTextStyle, margin: "0" }}>{paymentSummary}</Text>
      </Section>
      <Section style={{ textAlign: "center" }}>
        <Link href={adminUrl} style={buttonStyle}>
          Open retreat admin
        </Link>
      </Section>
    </EmailLayout>
  );
}
