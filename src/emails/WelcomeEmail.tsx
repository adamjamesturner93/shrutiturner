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

interface WelcomeEmailProps {
  firstName?: string;
}

export const WelcomeEmail = ({ firstName = "there" }: WelcomeEmailProps) => {
  const previewText = "Welcome to Shruti Turner's Studio";

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
                src="https://shrutiturner.com/logo.png" // Placeholder or use a real asset if available
                alt="Shruti Turner"
                width="150"
                className="mx-auto"
              />
            </Section>

            <Section className="rounded-lg border border-[#E5E5E5] bg-white p-8">
              <Heading className="text-text mb-4 text-center text-2xl font-normal">
                Welcome to the Studio, {firstName}
              </Heading>

              <Text className="text-text mb-4 text-base leading-relaxed">
                I'm so glad you're here. This space is built for bodies that need more than generic
                fitness advice—bodies that are complex, intelligent, and capable of building immense
                capacity.
              </Text>

              <Text className="text-text mb-6 text-base leading-relaxed">
                Whether you're here for rehabilitation-informed yoga, strength training, or simply
                to explore what your body can do without pain, you've taken the first step.
              </Text>

              <Section className="mb-8 text-center">
                <Button
                  className="bg-primary rounded px-6 py-3 text-base font-medium text-[#FAFAF8] no-underline"
                  href="https://shrutiturner.com/dashboard/schedule"
                >
                  View Class Schedule
                </Button>
              </Section>

              <Hr className="my-6 border-[#E5E5E5]" />

              <Text className="text-text/70 mb-2 text-sm">A few things to get you started:</Text>

              <ul className="text-text mb-6 list-disc space-y-2 pl-5 text-sm">
                <li>
                  Complete your{" "}
                  <Link
                    href="https://shrutiturner.com/dashboard/health-profile"
                    className="text-primary underline"
                  >
                    Health Profile
                  </Link>{" "}
                  so I can support you best.
                </li>
                <li>
                  Read the{" "}
                  <Link
                    href="https://shrutiturner.com/guidelines"
                    className="text-primary underline"
                  >
                    Studio Guidelines
                  </Link>{" "}
                  to understand our calm, respectful culture.
                </li>
                <li>Join a "Gentle Start" session if you're unsure where to begin.</li>
              </ul>
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

export default WelcomeEmail;
