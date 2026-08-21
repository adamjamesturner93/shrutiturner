import { Link, Text } from "@react-email/components";
import { EmailLayout } from "@/emails/components/email-layout";
import { bodyTextStyle, buttonStyle, headingStyle } from "@/emails/styles";

export default function WorkshopCancelledEmail({
  firstName,
  workshopName,
  purchaser,
  refundExpected = purchaser,
  supportUrl,
}: {
  firstName: string;
  workshopName: string;
  purchaser: boolean;
  refundExpected?: boolean;
  supportUrl: string;
}) {
  return (
    <EmailLayout preview={`${workshopName} has been cancelled`}>
      <Text style={headingStyle}>This workshop has been cancelled</Text>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Unfortunately, {workshopName} will not go ahead. Live-room and replay access have been
        closed.
      </Text>
      <Text style={bodyTextStyle}>
        {purchaser && refundExpected
          ? "A full refund is being submitted to the original payment method. You will receive a further update when it is complete."
          : purchaser
            ? "Your checkout has been closed and no payment is due."
            : "The person who purchased your place will receive any payment updates."}
      </Text>
      <Link href={supportUrl} style={buttonStyle}>
        Contact Shruti
      </Link>
    </EmailLayout>
  );
}
