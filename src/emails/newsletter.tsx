import { Section, Text, Img, Hr, Link } from "@react-email/components";
import type { ReactNode } from "react";
import { EmailLayout } from "./components/email-layout";
import { colors, fonts, bodyTextStyle, dividerStyle } from "./styles";

interface NewsletterEmailProps {
  firstName?: string;
  subject?: string;
  bodyContent?: string;
  signOffImageUrl?: string;
  signOffImageAlt?: string;
  unsubscribeUrl?: string;
}

type InlineToken =
  | { type: "text"; value: string }
  | { type: "strong"; value: string }
  | { type: "em"; value: string }
  | { type: "link"; label: string; href: string };

type MarkdownBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: number; text: string }
  | { type: "blockquote"; text: string }
  | { type: "hr" }
  | { type: "image"; alt: string; src: string }
  | { type: "list"; ordered: boolean; items: string[] };

const headingStyle = {
  fontFamily: fonts.heading,
  color: colors.brandDark,
  fontWeight: "700",
  lineHeight: "1.35",
  margin: "24px 0 12px 0",
};

const listStyle = {
  ...bodyTextStyle,
  margin: "0 0 8px 0",
};

function normalizeImageSrc(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "#" || trimmed.toLowerCase() === "undefined") return "";
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return trimmed;
}

function parseInline(input: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    if (match.index > cursor) {
      tokens.push({ type: "text", value: input.slice(cursor, match.index) });
    }

    const raw = match[0];
    const linkMatch = raw.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      tokens.push({ type: "link", label: linkMatch[1], href: linkMatch[2] });
    } else if (raw.startsWith("**") || raw.startsWith("__")) {
      tokens.push({ type: "strong", value: raw.slice(2, -2) });
    } else {
      tokens.push({ type: "em", value: raw.slice(1, -1) });
    }

    cursor = match.index + raw.length;
  }

  if (cursor < input.length) {
    tokens.push({ type: "text", value: input.slice(cursor) });
  }

  return tokens;
}

function renderInline(input: string): ReactNode {
  return parseInline(input).map((token, index) => {
    const key = `${token.type}-${index}`;
    if (token.type === "strong") {
      return (
        <strong key={key} style={{ fontWeight: 700 }}>
          {token.value}
        </strong>
      );
    }
    if (token.type === "em") {
      return (
        <em key={key} style={{ fontStyle: "italic" }}>
          {token.value}
        </em>
      );
    }
    if (token.type === "link") {
      return (
        <Link
          key={key}
          href={token.href}
          style={{ color: colors.brandAccent, textDecoration: "underline" }}
        >
          {token.label}
        </Link>
      );
    }
    return token.value;
  });
}

function parseNewsletterMarkdown(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let orderedList = false;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() });
      paragraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", ordered: orderedList, items: listItems });
      listItems = [];
      orderedList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      const src = normalizeImageSrc(imageMatch[2]);
      flushParagraph();
      flushList();
      if (src) {
        blocks.push({ type: "image", alt: imageMatch[1], src });
      }
      continue;
    }

    if (/^(---|\*\*\*|___)$/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push({ type: "hr" });
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      continue;
    }

    const blockquoteMatch = line.match(/^>\s?(.+)$/);
    if (blockquoteMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: "blockquote", text: blockquoteMatch[1].trim() });
      continue;
    }

    const unorderedMatch = line.match(/^[-+*]\s+(.+)$/);
    const orderedMatch = line.match(/^\d+[.)]\s+(.+)$/);
    if (unorderedMatch || orderedMatch) {
      flushParagraph();
      const nextOrdered = Boolean(orderedMatch);
      if (listItems.length > 0 && orderedList !== nextOrdered) {
        flushList();
      }
      orderedList = nextOrdered;
      listItems.push((orderedMatch?.[1] || unorderedMatch?.[1] || "").trim());
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

function renderMarkdown(markdown: string): ReactNode {
  return parseNewsletterMarkdown(markdown).map((block, index) => {
    if (block.type === "heading") {
      const fontSize = block.level === 1 ? "22px" : block.level === 2 ? "20px" : "18px";
      return (
        <Text key={index} style={{ ...headingStyle, fontSize }}>
          {renderInline(block.text)}
        </Text>
      );
    }

    if (block.type === "blockquote") {
      return (
        <Section
          key={index}
          style={{
            borderLeft: `3px solid ${colors.brandAccent}`,
            paddingLeft: "16px",
            margin: "20px 0",
          }}
        >
          <Text style={{ ...bodyTextStyle, fontStyle: "italic", color: colors.muted }}>
            {renderInline(block.text)}
          </Text>
        </Section>
      );
    }

    if (block.type === "hr") {
      return <Hr key={index} style={dividerStyle} />;
    }

    if (block.type === "image") {
      return (
        <Section key={index} style={{ margin: "24px 0" }}>
          <Img
            src={block.src}
            alt={block.alt}
            width="520"
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "6px",
              display: "block",
            }}
          />
          {block.alt ? (
            <Text
              style={{
                fontFamily: fonts.body,
                color: colors.muted,
                fontSize: "13px",
                fontStyle: "italic",
                lineHeight: "1.5",
                margin: "8px 0 0 0",
              }}
            >
              {block.alt}
            </Text>
          ) : null}
        </Section>
      );
    }

    if (block.type === "list") {
      return (
        <Section key={index} style={{ margin: "12px 0 20px 0" }}>
          {block.items.map((item, itemIndex) => (
            <Text key={itemIndex} style={listStyle}>
              {block.ordered ? `${itemIndex + 1}. ` : "\u2022 "}
              {renderInline(item)}
            </Text>
          ))}
        </Section>
      );
    }

    return (
      <Text key={index} style={bodyTextStyle}>
        {renderInline(block.text)}
      </Text>
    );
  });
}

export default function NewsletterEmail({
  firstName = "Adam",
  subject = "Expanding capacity without breaking.",
  bodyContent,
  signOffImageUrl,
  signOffImageAlt,
  unsubscribeUrl,
}: NewsletterEmailProps) {
  // Default body content matching the real newsletter style
  const defaultBody = [
    "How are you today? Maybe the crocuses and hints of sunshine are lifting your mood a little\u2026 or maybe the pollen has other ideas (maybe a little of both?!)",
    "Recently, I\u2019ve been thinking about discomfort. Not the dramatic or \u201cpush until you break\u201d kind that feels horrific. But the kind that shows up when you ask your body to do something just beyond what feels automatic.",
    "For me, that\u2019s been starting a new instructor training programme (watch this space\u2026) that focuses on fast tempo, music-led, movements I\u2019m not confident in. A very different experience from the slower, controlled strength and yoga work I usually teach and practise.",
    "And here\u2019s what I keep coming back to:",
  ];

  return (
    <EmailLayout preview={subject} category="marketing" unsubscribeUrl={unsubscribeUrl}>
      {/* Subject as serif heading */}
      <Text
        style={{
          fontFamily: fonts.heading,
          color: colors.brandDark,
          fontSize: "24px",
          fontWeight: "700",
          lineHeight: "1.3",
          margin: "0 0 28px 0",
          fontStyle: "italic",
        }}
      >
        {subject}
      </Text>

      <Text style={bodyTextStyle}>Hello {firstName},</Text>

      {bodyContent ? (
        renderMarkdown(bodyContent)
      ) : (
        <>
          {defaultBody.map((paragraph, i) => (
            <Text key={i} style={bodyTextStyle}>
              {paragraph}
            </Text>
          ))}

          {/* Bold callout - a key pattern from the real newsletter */}
          <Text
            style={{
              fontFamily: fonts.heading,
              color: colors.brandDark,
              fontSize: "18px",
              fontWeight: "700",
              lineHeight: "1.5",
              margin: "24px 0",
              fontStyle: "italic",
            }}
          >
            Discomfort is not the same thing as danger.
          </Text>

          <Text style={bodyTextStyle}>
            For many of us (especially when symptoms and recovery can vary) those signals get
            tangled. If you{"\u2019"}ve experienced flares or pain spikes, your system has learned
            that unpredictability can have consequences.
          </Text>

          <Text style={bodyTextStyle}>So caution makes sense.</Text>

          <Text style={bodyTextStyle}>
            But physiologically, adaptation requires exposure. Tissue capacity improves when load is
            introduced gradually and repeatedly. The nervous system becomes less reactive when it
            experiences controlled challenge followed by recovery.
          </Text>

          <Text
            style={{
              fontFamily: fonts.heading,
              color: colors.brandDark,
              fontSize: "18px",
              fontWeight: "700",
              lineHeight: "1.5",
              margin: "24px 0",
              fontStyle: "italic",
            }}
          >
            Not through force.{"\n"}Through dosage.
          </Text>

          <Text style={bodyTextStyle}>
            There is a way to stretch your capacity that builds trust rather than chipping it away.
          </Text>

          <Text style={bodyTextStyle}>
            This month, I{"\u2019"}d invite you to experiment with one small edge. Not something
            dramatic, but something measured.
          </Text>

          <Text style={bodyTextStyle}>
            Maybe choose one familiar movement and make the dose more precise. That might mean
            adding a little load, reducing the range, taking longer rests or stopping earlier than
            usual. The useful question is not whether it looked impressive, but whether it helped
            you build trust and recover well.
          </Text>

          <Text
            style={{
              ...bodyTextStyle,
              fontStyle: "italic",
              color: colors.muted,
            }}
          >
            What did I notice?{"\n"}How did I recover?{"\n"}What would I adjust next time?
          </Text>

          <Text style={bodyTextStyle}>
            Capacity isn{"\u2019"}t proven in a single session. It{"\u2019"}s built through
            repeated, respectful exposure that is guided by your body.
          </Text>

          <Text style={bodyTextStyle}>
            If you try something this month that stretches you, I{"\u2019"}d love to hear what you
            learn.
          </Text>
        </>
      )}

      <Text style={{ ...bodyTextStyle, marginTop: "24px" }}>
        Take care,
        <br />
        Shruti x
      </Text>

      <Hr style={dividerStyle} />

      {/* Optional sign-off image */}
      {signOffImageUrl && (
        <Section style={{ marginBottom: "8px" }}>
          <Img
            src={signOffImageUrl}
            alt={signOffImageAlt}
            width="520"
            height="400"
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "6px",
              display: "block",
            }}
          />
          {signOffImageAlt && (
            <Text
              style={{
                fontFamily: fonts.body,
                color: colors.muted,
                fontSize: "13px",
                fontStyle: "italic",
                lineHeight: "1.5",
                margin: "8px 0 0 0",
              }}
            >
              {signOffImageAlt}
            </Text>
          )}
        </Section>
      )}
    </EmailLayout>
  );
}
