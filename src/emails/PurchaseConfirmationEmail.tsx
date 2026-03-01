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

interface PurchaseConfirmationEmailProps {
  firstName?: string;
  purchaseDescription?: string;
  amount?: string;
  date?: string;
  invoiceId?: string;
}

export const PurchaseConfirmationEmail = ({
  firstName = "there",
  purchaseDescription = "10 Class Pack",
  amount = "£90.00",
  date = "March 15, 2026",
  invoiceId = "INV-12345678",
}: PurchaseConfirmationEmailProps) => {
  const previewText = `Receipt for your purchase of ${purchaseDescription}`;

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
                Payment Received
              </Heading>

              <Text className="text-text text-base leading-relaxed mb-6">
                Hi {firstName}, thank you for your purchase. Here is a receipt for your records.
              </Text>

              <Section className="bg-[#B5C49B]/10 p-6 rounded-lg mb-6">
                <Row className="mb-2">
                  <Column className="text-text/70 text-sm">Item</Column>
                  <Column className="text-text font-medium text-right">{purchaseDescription}</Column>
                </Row>
                <Row className="mb-2">
                  <Column className="text-text/70 text-sm">Date</Column>
                  <Column className="text-text font-medium text-right">{date}</Column>
                </Row>
                <Row className="mb-2">
                  <Column className="text-text/70 text-sm">Invoice ID</Column>
                  <Column className="text-text font-medium text-right">{invoiceId}</Column>
                </Row>
                <Hr className="border-[#4B5B32]/20 my-3" />
                <Row>
                  <Column className="text-text font-bold text-lg">Total</Column>
                  <Column className="text-text font-bold text-lg text-right">{amount}</Column>
                </Row>
              </Section>

              <Text className="text-text text-sm mb-6">
                Your credits/membership have been applied to your account instantly. You can now book your next session.
              </Text>

              <Section className="text-center mb-6">
                <Button
                  className="bg-primary text-[#FAFAF8] px-6 py-3 rounded text-base font-medium no-underline"
                  href="https://shrutiturner.com/dashboard/schedule"
                >
                  Book a Class
                </Button>
              </Section>
            </Section>

            <Section className="mt-8 text-center text-text/50 text-xs">
              <Text>
                Shruti Turner Coaching
                <br />
                PhD Biomechanics · PGDip Rehab · 650hr Yoga
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default PurchaseConfirmationEmail;
