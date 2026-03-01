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

interface InstructorNotificationEmailProps {
  type?: "first-signup" | "last-cancel";
  className?: string;
  classTime?: string;
  classDate?: string;
  attendeeCount?: number;
  attendeeName?: string;
}

export const InstructorNotificationEmail = ({
  type = "first-signup",
  className = "Slow Flow Yoga",
  classTime = "10:00 AM",
  classDate = "Tomorrow, March 15th",
  attendeeCount = 1,
  attendeeName = "Sarah Turner",
}: InstructorNotificationEmailProps) => {
  const isFirstSignup = type === "first-signup";
  const previewText = isFirstSignup
    ? `New Booking: ${className} (${classDate})`
    : `Last Person Cancelled: ${className}`;

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
                {isFirstSignup ? "New Student Signed Up!" : "Class Empty Alert"}
              </Heading>

              <Text className="text-text text-base leading-relaxed mb-6">
                {isFirstSignup
                  ? `${attendeeName} just booked into ${className}.`
                  : `The last person (${attendeeName}) just cancelled their booking for ${className}.`}
              </Text>

              <Section className="bg-[#B5C49B]/10 p-6 rounded-lg mb-6">
                <Text className="text-text font-bold text-lg mb-2">{className}</Text>
                <Text className="text-text text-sm mb-1">{classDate} at {classTime}</Text>
                <Text className="text-text text-sm font-medium">
                  Current Attendees: {attendeeCount}
                </Text>
              </Section>

              {!isFirstSignup && (
                <Text className="text-text/70 text-sm mb-6">
                  Since there are 0 attendees left, you might want to check the cancellation policy or notify waitlisted students.
                </Text>
              )}

              <Section className="text-center mb-6">
                <Button
                  className="bg-primary text-[#FAFAF8] px-6 py-3 rounded text-base font-medium no-underline"
                  href="https://shrutiturner.com/admin/dashboard"
                >
                  View Class Roster
                </Button>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default InstructorNotificationEmail;
