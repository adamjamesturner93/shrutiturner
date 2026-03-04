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
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";

interface BookingConfirmationEmailProps {
  className?: string;
  classTime?: string;
  classDate?: string;
  firstName?: string;
}

export const BookingConfirmationEmail = ({
  className = "Slow Flow Yoga",
  classTime = "10:00 AM",
  classDate = "Tomorrow, March 15th",
  firstName = "there",
}: BookingConfirmationEmailProps) => {
  const previewText = `Your booking for ${className} is confirmed`;

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
              <Heading className="text-text mb-4 text-center text-2xl font-normal">
                Booking Confirmed
              </Heading>

              <Text className="text-text mb-6 text-base leading-relaxed">
                Hi {firstName}, just confirming your spot for <strong>{className}</strong> on{" "}
                {classDate} at {classTime}.
              </Text>

              <Section className="mb-6 rounded-lg bg-[#B5C49B]/10 p-6 text-center">
                <Text className="text-text mb-2 text-xl font-bold">{className}</Text>
                <Text className="text-text mb-1">{classDate}</Text>
                <Text className="text-text mb-4">{classTime}</Text>

                <Button
                  className="bg-primary mb-4 rounded px-6 py-3 text-base font-medium text-[#FAFAF8] no-underline"
                  href="https://shrutiturner.com/dashboard/schedule"
                >
                  View Details & Join
                </Button>

                <Text className="text-text/60 mb-2 text-xs tracking-wider uppercase">
                  Add to Calendar
                </Text>
                <Row>
                  <Column align="center">
                    <Link
                      href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(className)}&details=${encodeURIComponent("Join at https://shrutiturner.com/dashboard/schedule")}&location=Online`}
                      className="text-text/70 mx-2 text-xs underline"
                    >
                      Google
                    </Link>
                    <Link
                      href={`https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(className)}&body=${encodeURIComponent("Join at https://shrutiturner.com/dashboard/schedule")}&location=Online`}
                      className="text-text/70 mx-2 text-xs underline"
                    >
                      Outlook
                    </Link>
                    <Link href="#" className="text-text/70 mx-2 text-xs underline">
                      Apple (ICS)
                    </Link>
                  </Column>
                </Row>
              </Section>

              <Hr className="my-6 border-[#E5E5E5]" />

              <Heading className="text-text mb-3 text-lg font-medium">Important Reminders</Heading>

              <ul className="text-text mb-6 list-disc space-y-2 pl-5 text-sm">
                <li>Arrive 5 minutes early to settle in.</li>
                <li>Wear comfortable clothing that allows movement.</li>
                <li>
                  If you have specific needs today, please message me before class or arrive early
                  to chat.
                </li>
                <li>Ensure you have a stable internet connection for the video call.</li>
              </ul>

              <Text className="text-text text-sm">
                Need to reschedule? You can do so up to 12 hours before class from your{" "}
                <Link href="https://shrutiturner.com/dashboard" className="text-primary underline">
                  dashboard
                </Link>
                .
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

export default BookingConfirmationEmail;
