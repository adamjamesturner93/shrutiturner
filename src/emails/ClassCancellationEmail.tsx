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
} from "@react-email/components";
import * as React from "react";

interface ClassCancellationEmailProps {
  firstName?: string;
  className?: string;
  classDate?: string;
  classTime?: string;
  isInstructorInitiated?: boolean;
}

export const ClassCancellationEmail = ({
  firstName = "there",
  className = "Slow Flow Yoga",
  classDate = "Tomorrow, March 15th",
  classTime = "10:00 AM",
  isInstructorInitiated = true,
}: ClassCancellationEmailProps) => {
  const previewText = `Cancellation Confirmation: ${className}`;

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
                Class Cancelled
              </Heading>

              <Text className="text-text mb-6 text-base leading-relaxed">
                Hi {firstName},
                <br />
                {isInstructorInitiated
                  ? `We're sorry, but the ${className} session on ${classDate} has been cancelled by the instructor.`
                  : `Just confirming that your booking for ${className} on ${classDate} has been cancelled.`}
              </Text>

              <Section className="mb-6 rounded-lg bg-[#B5C49B]/10 p-6 opacity-70">
                <Text className="text-text mb-2 text-lg font-bold line-through decoration-red-500/50 decoration-2">
                  {className}
                </Text>
                <Text className="text-text mb-1 text-sm">
                  {classDate} at {classTime}
                </Text>
                <Text className="mt-2 text-sm font-medium text-red-600">CANCELLED</Text>
              </Section>

              <Text className="text-text mb-6 text-sm">
                Your credit/membership allowance has been returned to your account automatically.
              </Text>

              <Hr className="my-6 border-[#E5E5E5]" />

              <Text className="text-text/70 mb-2 text-sm">
                <strong>Calendar Update:</strong>
              </Text>
              <Text className="text-text/70 text-sm">
                Please remove this event from your personal calendar.
              </Text>

              <Section className="mt-8 text-center">
                <Button
                  className="bg-primary rounded px-6 py-3 text-base font-medium text-[#FAFAF8] no-underline"
                  href="https://shrutiturner.com/dashboard/schedule"
                >
                  Book Another Class
                </Button>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ClassCancellationEmail;
