import { Section, Text, Img, Hr } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { colors, fonts, bodyTextStyle, dividerStyle } from "./styles";

interface NewsletterEmailProps {
  firstName?: string;
  subject?: string;
  bodyContent?: string;
  signOffImageUrl?: string;
  signOffImageAlt?: string;
}

export default function NewsletterEmail({
  firstName = "Adam",
  subject = "Expanding capacity without breaking.",
  bodyContent,
  signOffImageUrl = "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=520&h=400&fit=crop",
  signOffImageAlt = "Bonnie taking some time for recovery after her long and arduous playtime in the park!",
}: NewsletterEmailProps) {
  // Default body content matching the real newsletter style
  const defaultBody = [
    "How are you today? Maybe the crocuses and hints of sunshine are lifting your mood a little\u2026 or maybe the pollen has other ideas (maybe a little of both?!)",
    "Recently, I\u2019ve been thinking about discomfort. Not the dramatic or \u201cpush until you break\u201d kind that feels horrific. But the kind that shows up when you ask your body to do something just beyond what feels automatic.",
    "For me, that\u2019s been starting a new instructor training programme (watch this space\u2026) that focuses on fast tempo, music-led, movements I\u2019m not confident in. A very different experience from the slower, controlled strength and yoga work I usually teach and practise.",
    "And here\u2019s what I keep coming back to:",
  ];

  return (
    <EmailLayout preview={subject} category="marketing">
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

      {/* Body paragraphs - in production these come from Contentful markdown */}
      {bodyContent ? (
        <Text style={bodyTextStyle} dangerouslySetInnerHTML={{ __html: bodyContent }} />
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
            For many of us (especially with bodies that can feel unpredictable) those signals get
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
            Maybe try that new class with your trusted studio or increase the weight on your barbell
            slightly. Try a variation that feels unfamiliar. Or, if you often push yourself too far,
            perhaps experiment with stopping earlier.
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
