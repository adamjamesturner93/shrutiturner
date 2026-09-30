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
    <Html lang="en">
      <Head>
        <title>{preview}</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media only screen and (max-width: 480px) {
                .email-body > table > tbody > tr > td { padding: 16px 8px !important; }
                .email-content { padding: 28px 20px 24px !important; }
                .email-footer { padding: 0 20px 28px !important; }
              }
            `,
          }}
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        className="email-body"
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
              src={`${websiteUrl}/logos/logo-white-horizontal-email.png`}
              alt="Shruti Turner"
              width="240"
              height="61"
              style={{
                display: "block",
                maxWidth: "100%",
                height: "auto",
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
          <Section
            className="email-content"
            style={{ padding: "40px 40px 32px", overflowWrap: "anywhere" }}
          >
            {children}
          </Section>

          {/* Footer */}
          <Section className="email-footer" style={{ padding: "0 40px 40px" }}>
            <Hr style={dividerStyle} />
            <Text style={footerTextStyle}>Shruti Turner</Text>
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
                  color: colors.muted,
                  marginTop: "16px",
                }}
              >
                {"You're receiving this because you signed up at shrutiturner.co.uk."}
                <br />
                <Link
                  href={unsubscribeUrl}
                  style={{ color: colors.muted, textDecoration: "underline" }}
                >
                  Unsubscribe
                </Link>
                {"  \u00b7  "}
                <Link
                  href={privacyUrl}
                  style={{ color: colors.muted, textDecoration: "underline" }}
                >
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
