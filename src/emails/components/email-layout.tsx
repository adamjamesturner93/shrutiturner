import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Img,
} from "@react-email/components";
import { colors, fonts, containerStyle, footerTextStyle, dividerStyle } from "../styles";

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
  websiteUrl?: string;
  instagramUrl?: string;
  contactUrl?: string;
  privacyUrl?: string;
  unsubscribeUrl?: string;
  category?: "marketing" | "transactional";
}

export function EmailLayout({
  preview,
  children,
  websiteUrl = "https://shrutiturner.co.uk",
  instagramUrl = "https://instagram.com/shrutiturner",
  contactUrl = "https://shrutiturner.co.uk/contact",
  privacyUrl = "https://shrutiturner.co.uk/privacy",
  unsubscribeUrl = "https://shrutiturner.co.uk/unsubscribe",
  category = "transactional",
}: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Libre+Baskerville:wght@400;700&display=swap');
            `,
          }}
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#edecea",
          fontFamily: fonts.body,
          margin: "0",
          padding: "40px 16px",
        }}
      >
        <Container style={containerStyle}>
          {/* Header */}
          <Section
            style={{
              backgroundColor: colors.brandDark,
              padding: "28px 40px",
              textAlign: "center" as const,
            }}
          >
            <Img
              src={`${websiteUrl}/logos/logo-white-horizontal.svg?v=2`}
              alt="Shruti Turner Private Studio"
              width="240"
              height="61"
              style={{
                display: "block",
                margin: "0 auto",
              }}
            />
          </Section>

          {/* Accent stripe */}
          <Section
            style={{
              backgroundColor: colors.brandAccent,
              height: "3px",
              lineHeight: "0",
              fontSize: "0",
            }}
          >
            <Text style={{ margin: "0", fontSize: "0", lineHeight: "0" }}>{"\u200B"}</Text>
          </Section>

          {/* Content */}
          <Section style={{ padding: "40px 40px 32px" }}>{children}</Section>

          {/* Footer */}
          <Section style={{ padding: "0 40px 40px" }}>
            <Hr style={dividerStyle} />
            <Text style={footerTextStyle}>Shruti Turner | Private Studio</Text>
            <Text style={footerTextStyle}>
              <Link
                href={websiteUrl}
                style={{ color: colors.brandAccent, textDecoration: "underline" }}
              >
                Website
              </Link>
              {"  \u00b7  "}
              <Link
                href={instagramUrl}
                style={{ color: colors.brandAccent, textDecoration: "underline" }}
              >
                Instagram
              </Link>
              {"  \u00b7  "}
              <Link
                href={contactUrl}
                style={{ color: colors.brandAccent, textDecoration: "underline" }}
              >
                Get in Touch
              </Link>
              {"  \u00b7  "}
              <Link
                href={privacyUrl}
                style={{ color: colors.brandAccent, textDecoration: "underline" }}
              >
                Privacy Policy
              </Link>
            </Text>
            {category === "marketing" ? (
              <Text
                style={{
                  ...footerTextStyle,
                  fontSize: "12px",
                  color: "#a0a098",
                  marginTop: "16px",
                }}
              >
                {"You're receiving this because you signed up at shrutiturner.co.uk."}
                <br />
                <Link
                  href={unsubscribeUrl}
                  style={{ color: "#a0a098", textDecoration: "underline" }}
                >
                  Unsubscribe
                </Link>
                {"  \u00b7  "}
                <Link href={privacyUrl} style={{ color: "#a0a098", textDecoration: "underline" }}>
                  Privacy Policy
                </Link>
              </Text>
            ) : null}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
