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
                Class Cancelled
              </Heading>

              <Text className="text-text text-base leading-relaxed mb-6">
                Hi {firstName},
                <br />
                {isInstructorInitiated
                  ? `We're sorry, but the ${className} session on ${classDate} has been cancelled by the instructor.`
                  : `Just confirming that your booking for ${className} on ${classDate} has been cancelled.`}
              </Text>

              <Section className="bg-[#B5C49B]/10 p-6 rounded-lg mb-6 opacity-70">
                <Text className="text-text font-bold text-lg mb-2 line-through decoration-red-500/50 decoration-2">
                  {className}
                </Text>
                <Text className="text-text text-sm mb-1">{classDate} at {classTime}</Text>
                <Text className="text-red-600 font-medium text-sm mt-2">CANCELLED</Text>
              </Section>

              <Text className="text-text text-sm mb-6">
                Your credit/membership allowance has been returned to your account automatically.
              </Text>

              <Hr className="border-[#E5E5E5] my-6" />

              <Text className="text-text/70 text-sm mb-2">
                <strong>Calendar Update:</strong>
              </Text>
              <Text className="text-text/70 text-sm">
                Please remove this event from your personal calendar.
              </Text>

              <Section className="text-center mt-8">
                <Button
                  className="bg-primary text-[#FAFAF8] px-6 py-3 rounded text-base font-medium no-underline"
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
