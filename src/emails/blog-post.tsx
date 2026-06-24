import { Section, Text, Link, Img, Hr } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import {
  colors,
  fonts,
  headingStyle,
  bodyTextStyle,
  mutedTextStyle,
  buttonStyle,
  dividerStyle,
} from "./styles";

interface BlogPostEmailProps {
  firstName?: string;
  postTitle?: string;
  postExcerpt?: string;
  postImageUrl?: string;
  postUrl?: string;
  publishDate?: string;
  tags?: string[];
  blogUrl?: string;
  unsubscribeUrl?: string;
}

export default function BlogPostEmail({
  firstName = "there",
  postTitle = "Why Strength Training Matters When You Have Chronic Illness",
  postExcerpt = "Exploring the evidence for resistance training in managing autoimmune conditions, chronic pain and fatigue \u2014 and how to start without pushing past your limits.",
  postImageUrl,
  postUrl = "https://shrutiturner.co.uk/blog/strength-training-chronic-illness",
  publishDate = "4 March 2026",
  tags = ["Strength Training", "Chronic Illness", "Evidence-Based"],
  blogUrl = "https://shrutiturner.co.uk/blog",
  unsubscribeUrl,
}: BlogPostEmailProps) {
  return (
    <EmailLayout
      preview={`New on the blog: ${postTitle}`}
      category="marketing"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={{ ...bodyTextStyle, marginBottom: "24px" }}>Hi {firstName},</Text>

      <Text style={bodyTextStyle}>
        {"I\u2019ve just published a new post on my blog I thought you\u2019d be interested in."}
      </Text>

      {/* Article Card */}
      <Section
        style={{
          backgroundColor: "#ffffff",
          border: `1px solid ${colors.border}`,
          borderRadius: "8px",
          overflow: "hidden",
          marginBottom: "28px",
          marginTop: "8px",
        }}
      >
        {postImageUrl && (
          <Img
            src={postImageUrl}
            alt={postTitle}
            width="520"
            height="260"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
            }}
          />
        )}
        <Section style={{ padding: "24px 28px" }}>
          {/* Tags */}
          {tags && tags.length > 0 && (
            <Section style={{ marginBottom: "12px" }}>
              {tags.map((tag) => (
                <Text
                  key={tag}
                  style={{
                    fontFamily: fonts.body,
                    color: colors.brandDark,
                    fontSize: "11px",
                    fontWeight: "500",
                    lineHeight: "1",
                    margin: "0 6px 6px 0",
                    padding: "4px 10px",
                    borderRadius: "100px",
                    border: `1px solid ${colors.border}`,
                    display: "inline-block" as const,
                    letterSpacing: "0.02em",
                  }}
                >
                  {tag}
                </Text>
              ))}
            </Section>
          )}

          <Text
            style={{
              ...headingStyle,
              fontSize: "20px",
              lineHeight: "1.3",
              marginBottom: "12px",
            }}
          >
            {postTitle}
          </Text>

          <Text
            style={{
              ...mutedTextStyle,
              fontSize: "13px",
              marginBottom: "16px",
              textTransform: "uppercase" as const,
              letterSpacing: "0.04em",
            }}
          >
            {publishDate}
          </Text>

          <Text
            style={{
              ...bodyTextStyle,
              fontSize: "15px",
              color: colors.muted,
              marginBottom: "24px",
              lineHeight: "1.6",
            }}
          >
            {postExcerpt}
          </Text>

          <Link href={postUrl} style={buttonStyle}>
            Read the full article
          </Link>
        </Section>
      </Section>

      <Hr style={dividerStyle} />

      <Text style={{ ...mutedTextStyle, fontSize: "14px" }}>
        If something resonated with you, feel free to reply to this email. I always love hearing
        from you.
      </Text>

      <Text
        style={{
          ...mutedTextStyle,
          fontSize: "14px",
          marginTop: "8px",
        }}
      >
        {"You can also "}
        <Link href={blogUrl} style={{ color: colors.brandAccent, textDecoration: "underline" }}>
          browse all articles
        </Link>
        {" on the blog."}
      </Text>

      <Text style={{ ...bodyTextStyle, marginTop: "24px" }}>
        Hope you enjoy,
        <br />
        Shruti
      </Text>
    </EmailLayout>
  );
}
