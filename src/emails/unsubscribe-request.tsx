import { Link, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, buttonStyle, headingStyle, mutedTextStyle, colors } from "./styles";

type UnsubscribeRequestEmailProps = {
  unsubscribeUrl: string;
};

export default function UnsubscribeRequestEmail({ unsubscribeUrl }: UnsubscribeRequestEmailProps) {
  return (
    <EmailLayout preview="Confirm your unsubscribe request">
      <Text
        style={{
          ...headingStyle,
          fontSize: "24px",
          lineHeight: "1.3",
          marginBottom: "20px",
        }}
      >
        Confirm your unsubscribe request
      </Text>

      <Text style={bodyTextStyle}>Hi,</Text>
      <Text style={bodyTextStyle}>
        Use the secure link below to confirm that you want to stop receiving Shruti Turner marketing
        emails.
      </Text>

      <Link href={unsubscribeUrl} style={buttonStyle}>
        Confirm unsubscribe
      </Link>

      <Text style={{ ...mutedTextStyle, marginTop: "24px", color: colors.muted }}>
        If you did not request this, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}
