import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Img,
  Heading,
  Text,
  Button,
  Link,
  Tailwind,
  Hr,
  Markdown,
} from "@react-email/components";
import * as React from "react";

interface NewsletterEmailProps {
  subject?: string;
  markdownContent?: string;
  previewText?: string;
}

export const NewsletterEmail = ({
  subject = "Weekly Studio Update: Strength & Stillness",
  previewText = "This week: Wrist stability focus and new class times.",
  markdownContent = `
## Welcome to this week's update!

This week we're focusing on **wrist stability** in our yoga flows and *progressive overload* in our strength sessions.

> "The body is not a machine to be fixed, but a garden to be tended."

### New Class Times
We've added a new 6pm Strength Foundations class on Tuesdays.

[Check the schedule](https://shrutiturner.com/dashboard/schedule)

See you on the mat,
Shruti
  `,
}: NewsletterEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                background: "#FAFAF8",
                primary: "#4B5B32",
                secondary: "#B5C49B",
                text: "#2E1F33",
              },
            },
          },
        }}
      >
        <Body className="bg-background font-sans text-[#2E1F33]">
          <Container className="mx-auto p-4 max-w-xl">
            <Section className="mt-8 mb-8 text-center">
              <Img
                src="https://shrutiturner.com/logo.png"
                alt="Shruti Turner"
                width="150"
                className="mx-auto"
              />
            </Section>

            <Section className="bg-white p-8 rounded-lg border border-[#E5E5E5]">
              <Heading className="text-2xl font-normal text-[#2E1F33] mb-6 text-center">
                {subject}
              </Heading>
              
              <div className="prose prose-p:text-[#2E1F33] prose-headings:text-[#2E1F33] text-base leading-relaxed">
                <Markdown
                  markdownCustomStyles={{
                    h1: { color: '#2E1F33' },
                    h2: { color: '#2E1F33', marginTop: '1.5em', marginBottom: '0.5em' },
                    h3: { color: '#2E1F33' },
                    p: { color: '#2E1F33', lineHeight: '1.6' },
                    ul: { color: '#2E1F33' },
                    ol: { color: '#2E1F33' },
                    li: { color: '#2E1F33' },
                    blockQuote: { borderLeft: '4px solid #B5C49B', paddingLeft: '1em', color: '#4B5B32', fontStyle: 'italic' },
                  }}
                >
                  {markdownContent}
                </Markdown>
              </div>

              <Hr className="border-[#E5E5E5] my-8" />

              <Section className="text-center mb-6">
                <Button
                  className="bg-[#4B5B32] text-[#FAFAF8] px-6 py-3 rounded text-base font-medium no-underline"
                  href="https://shrutiturner.com/dashboard/schedule"
                >
                  View Schedule
                </Button>
              </Section>
            </Section>

            <Section className="mt-8 text-center text-[#2E1F33]/50 text-xs space-y-2">
              <Text>
                You are receiving this because you subscribed to the Shruti Turner newsletter.
              </Text>
              <Text>
                <Link href="https://shrutiturner.com/unsubscribe" className="text-[#2E1F33]/50 underline">Unsubscribe</Link> | <Link href="#" className="text-[#2E1F33]/50 underline">View in Browser</Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default NewsletterEmail;
