import { Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, buttonStyle, mutedTextStyle } from "./styles";

export default function HealthProfileUpdatedNotificationEmail({
  memberName,
  memberEmail,
  memberUrl,
}: {
  memberName: string;
  memberEmail: string;
  memberUrl: string;
}) {
  return (
    <EmailLayout preview={`${memberName} updated their health profile`}>
      <Text style={bodyTextStyle}>{memberName} has updated their health profile.</Text>
      <Text style={mutedTextStyle}>{memberEmail}</Text>
      <Text style={mutedTextStyle}>
        Health details are intentionally omitted from email. Review them in the secure admin area.
      </Text>
      <Section style={{ textAlign: "center" }}>
        <Link href={memberUrl} style={buttonStyle}>
          Review member profile
        </Link>
      </Section>
    </EmailLayout>
  );
}
