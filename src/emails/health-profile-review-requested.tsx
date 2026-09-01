import { Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, buttonStyle, mutedTextStyle } from "./styles";

export default function HealthProfileReviewRequestedEmail({
  firstName,
  healthProfileUrl,
}: {
  firstName: string;
  healthProfileUrl: string;
}) {
  return (
    <EmailLayout preview="Please review your health profile">
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Shruti has updated your health profile using information you shared. Please sign in to
        review it, correct anything that is not right, and confirm that it is current.
      </Text>
      <Text style={mutedTextStyle}>
        For privacy, this email does not include any health information.
      </Text>
      <Section style={{ textAlign: "center" }}>
        <Link href={healthProfileUrl} style={buttonStyle}>
          Review health profile
        </Link>
      </Section>
    </EmailLayout>
  );
}
