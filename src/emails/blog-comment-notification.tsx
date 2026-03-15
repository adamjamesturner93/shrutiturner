import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, headingStyle, mutedTextStyle, buttonStyle, colors } from "./styles";

interface BlogCommentNotificationEmailProps {
  authorName: string;
  postSlug: string;
  content: string;
  postUrl: string;
}

export default function BlogCommentNotificationEmail({
  authorName,
  postSlug,
  content,
  postUrl,
}: BlogCommentNotificationEmailProps) {
  return (
    <EmailLayout preview={`New blog comment from ${authorName}`}>
      <Text style={headingStyle}>New blog comment</Text>
      <Text style={bodyTextStyle}>
        {authorName} commented on <strong>{postSlug}</strong>.
      </Text>
      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "24px",
          margin: "20px 0",
        }}
      >
        <Text style={mutedTextStyle}>{content}</Text>
      </Section>
      <Section style={{ textAlign: "center" }}>
        <Link href={postUrl} style={buttonStyle}>
          View post
        </Link>
      </Section>
    </EmailLayout>
  );
}
