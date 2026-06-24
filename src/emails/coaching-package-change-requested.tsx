import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { bodyTextStyle, buttonStyle, colors, headingStyle, mutedTextStyle } from "./styles";

interface CoachingPackageChangeRequestedEmailProps {
  firstName: string;
  fromLabel: string;
  toLabel: string;
  effectiveMode: "next_invoice" | "immediate";
  dashboardUrl: string;
  note?: string | null;
}

export default function CoachingPackageChangeRequestedEmail({
  firstName,
  fromLabel,
  toLabel,
  effectiveMode,
  dashboardUrl,
  note,
}: CoachingPackageChangeRequestedEmailProps) {
  const timing =
    effectiveMode === "immediate"
      ? "The change is intended to take effect straight away after you confirm."
      : "The new price is intended to apply from your next Stripe invoice.";

  return (
    <EmailLayout preview="Review your 1:1 package change">
      <Text style={headingStyle}>Review your 1:1 package change</Text>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Shruti has suggested moving your 1:1 package from {fromLabel} to {toLabel}.
      </Text>
      <Section
        style={{
          backgroundColor: colors.secondaryBg,
          borderRadius: "8px",
          padding: "24px",
          margin: "20px 0",
        }}
      >
        <Text style={bodyTextStyle}>What happens next:</Text>
        <Text style={mutedTextStyle}>1. Sign in to your dashboard and review the new package.</Text>
        <Text style={mutedTextStyle}>
          2. Confirm the change after reviewing the current terms and health waiver.
        </Text>
        <Text style={mutedTextStyle}>3. {timing}</Text>
      </Section>
      {note ? (
        <Section
          style={{
            backgroundColor: colors.secondaryBg,
            borderRadius: "8px",
            padding: "24px",
            margin: "20px 0",
          }}
        >
          <Text style={bodyTextStyle}>A note from Shruti:</Text>
          <Text style={mutedTextStyle}>{note}</Text>
        </Section>
      ) : null}
      <Section style={{ textAlign: "center" }}>
        <Link href={dashboardUrl} style={buttonStyle}>
          Review package change
        </Link>
      </Section>
    </EmailLayout>
  );
}
