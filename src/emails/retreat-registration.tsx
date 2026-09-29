import { Heading, Link, Text } from "@react-email/components";
import { EmailLayout } from "@/emails/components/email-layout";
import { bodyTextStyle, buttonStyle, headingStyle, mutedTextStyle } from "@/emails/styles";

export default function RetreatRegistrationEmail({
  name,
  title,
  url,
}: {
  name: string;
  title: string;
  url: string;
}) {
  return (
    <EmailLayout preview={`Your place at ${title} — get ready in My Studio`}>
      <Heading style={{ ...headingStyle, fontSize: "28px", marginBottom: "24px" }}>
        Your place at {title}
      </Heading>
      <Text style={bodyTextStyle}>Hi {name},</Text>
      <Text style={bodyTextStyle}>
        Your place is reserved. Next, sign in or create your account to get ready in My Studio.
      </Text>
      <Text style={bodyTextStyle}>
        We’ll guide you through any details and agreements needed before you attend. If you already
        have a profile, you can review and confirm your existing information.
      </Text>
      <Link href={url} style={buttonStyle}>
        Complete my attendee setup
      </Link>
      <Text style={{ ...mutedTextStyle, marginTop: "24px" }}>
        Your health information is private. Only you and authorised staff can see it. The person who
        booked your place can see whether your setup is complete, but not your private answers.
      </Text>
      <Text style={bodyTextStyle}>
        See you soon,
        <br />
        Shruti
      </Text>
    </EmailLayout>
  );
}
