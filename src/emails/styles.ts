import { BRAND_TOKENS } from "@/brand/tokens";

// Shruti Turner Brand Colors & Shared Email Styles
export const colors = {
  ...BRAND_TOKENS.colors,
  // Email-only tint variant.
  brandDarkLight: "#D5C8B8",
} as const;

export const fonts = BRAND_TOKENS.fonts;

export const containerStyle = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: colors.brandWhite,
} as const;

export const headingStyle = {
  fontFamily: fonts.heading,
  color: colors.brandDark,
  fontWeight: "700" as const,
  margin: "0",
};

export const bodyTextStyle = {
  fontFamily: fonts.body,
  color: colors.brandDark,
  fontSize: "16px",
  lineHeight: "1.7",
  margin: "0 0 16px 0",
};

export const mutedTextStyle = {
  ...bodyTextStyle,
  color: colors.muted,
  fontSize: "14px",
};

export const buttonStyle = {
  fontFamily: fonts.body,
  backgroundColor: colors.brandAccent,
  color: colors.brandWhite,
  padding: "14px 32px",
  borderRadius: "6px",
  fontSize: "16px",
  fontWeight: "500" as const,
  textDecoration: "none",
  display: "inline-block" as const,
  textAlign: "center" as const,
};

export const dividerStyle = {
  borderColor: colors.border,
  margin: "32px 0",
};

export const footerTextStyle = {
  fontFamily: fonts.body,
  color: colors.muted,
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0 0 8px 0",
};
