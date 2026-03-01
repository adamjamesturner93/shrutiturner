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
              <Heading className="text-xl font-normal text-text mb-4 text-center">
                Your class is starting soon
              </Heading>

              <Text className="text-text text-base leading-relaxed mb-6">
                Hi {firstName}, this is a gentle reminder that <strong>{className}</strong> begins at {classTime}.
              </Text>

              <Section className="text-center mb-6">
                <Button
                  className="bg-primary text-[#FAFAF8] px-6 py-3 rounded text-base font-medium no-underline"
                  href={joinLink}
                >
                  Join Class
                </Button>
              </Section>
              
              <Text className="text-text text-sm mb-4 text-center">
                The studio opens 10 minutes before class.
              </Text>

              <Hr className="border-[#E5E5E5] my-6" />

              <Text className="text-text text-sm">
                <strong>Equipment check:</strong>
                <br />
                Ensure you have your mat, any props you need, and water nearby.
              </Text>
            </Section>

            <Section className="mt-8 text-center text-text/50 text-xs">
              <Text>
                Shruti Turner Coaching
                <br />
                PhD Biomechanics · PGDip Rehab · 650hr Yoga
              </Text>
              <Text>
                <Link href="https://shrutiturner.com/unsubscribe" className="text-text/50 underline">Unsubscribe</Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ClassReminderEmail;
