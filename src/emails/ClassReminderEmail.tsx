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
  Hr,
  Link,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface ClassReminderEmailProps {
  firstName?: string;
  className?: string;
  classTime?: string;
  joinLink?: string;
}

export const ClassReminderEmail = ({
  firstName = "there",
  className = "Slow Flow Yoga",
  classTime = "10:00 AM",
  joinLink = "https://shrutiturner.com/dashboard/schedule",
}: ClassReminderEmailProps) => {
  const previewText = `Reminder: ${className} starts in 1 hour`;

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
        <Body className="bg-background font-sans">
          <Container className="mx-auto max-w-xl p-4">
            <Section className="mt-8 mb-8 text-center">
              <Img
                src="https://shrutiturner.com/logo.png"
                alt="Shruti Turner"
                width="150"
                className="mx-auto"
              />
            </Section>

            <Section className="rounded-lg border border-[#E5E5E5] bg-white p-8">
              <Heading className="text-text mb-4 text-center text-xl font-normal">
                Your class is starting soon
              </Heading>

              <Text className="text-text mb-6 text-base leading-relaxed">
                Hi {firstName}, this is a gentle reminder that <strong>{className}</strong> begins
                at {classTime}.
              </Text>

              <Section className="mb-6 text-center">
                <Button
                  className="bg-primary rounded px-6 py-3 text-base font-medium text-[#FAFAF8] no-underline"
                  href={joinLink}
                >
                  Join Class
                </Button>
              </Section>

              <Text className="text-text mb-4 text-center text-sm">
                The studio opens 10 minutes before class.
              </Text>

              <Hr className="my-6 border-[#E5E5E5]" />

              <Text className="text-text text-sm">
                <strong>Equipment check:</strong>
                <br />
                Ensure you have your mat, any props you need, and water nearby.
              </Text>
            </Section>

            <Section className="text-text/50 mt-8 text-center text-xs">
              <Text>
                Shruti Turner Coaching
                <br />
                PhD Biomechanics · PGDip Rehab · 650hr Yoga
              </Text>
              <Text>
                <Link
                  href="https://shrutiturner.com/unsubscribe"
                  className="text-text/50 underline"
                >
                  Unsubscribe
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ClassReminderEmail;
