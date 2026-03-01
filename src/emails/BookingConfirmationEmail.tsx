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
              <Heading className="text-2xl font-normal text-text mb-4 text-center">
                Booking Confirmed
              </Heading>

              <Text className="text-text text-base leading-relaxed mb-6">
                Hi {firstName}, just confirming your spot for <strong>{className}</strong> on {classDate} at {classTime}.
              </Text>

              <Section className="bg-[#B5C49B]/10 p-6 rounded-lg text-center mb-6">
                <Text className="text-text font-bold mb-2 text-xl">{className}</Text>
                <Text className="text-text mb-1">{classDate}</Text>
                <Text className="text-text mb-4">{classTime}</Text>

                <Button
                  className="bg-primary text-[#FAFAF8] px-6 py-3 rounded text-base font-medium no-underline mb-4"
                  href="https://shrutiturner.com/dashboard/schedule"
                >
                  View Details & Join
                </Button>

                <Text className="text-xs text-text/60 uppercase tracking-wider mb-2">Add to Calendar</Text>
                <Row>
                  <Column align="center">
                    <Link
                      href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(className)}&details=${encodeURIComponent("Join at https://shrutiturner.com/dashboard/schedule")}&location=Online`}
                      className="text-text/70 underline text-xs mx-2"
                    >
                      Google
                    </Link>
                    <Link
                      href={`https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(className)}&body=${encodeURIComponent("Join at https://shrutiturner.com/dashboard/schedule")}&location=Online`}
                      className="text-text/70 underline text-xs mx-2"
                    >
                      Outlook
                    </Link>
                    <Link
                      href="#" 
                      className="text-text/70 underline text-xs mx-2"
                    >
                      Apple (ICS)
                    </Link>
                  </Column>
                </Row>
              </Section>

              <Hr className="border-[#E5E5E5] my-6" />

              <Heading className="text-lg font-medium text-text mb-3">Important Reminders</Heading>
              
              <ul className="text-text text-sm list-disc pl-5 mb-6 space-y-2">
                <li>Arrive 5 minutes early to settle in.</li>
                <li>Wear comfortable clothing that allows movement.</li>
                <li>If you have specific needs today, please message me before class or arrive early to chat.</li>
                <li>Ensure you have a stable internet connection for the video call.</li>
              </ul>
              
              <Text className="text-text text-sm">
                Need to reschedule? You can do so up to 12 hours before class from your <Link href="https://shrutiturner.com/dashboard" className="text-primary underline">dashboard</Link>.
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

export default BookingConfirmationEmail;