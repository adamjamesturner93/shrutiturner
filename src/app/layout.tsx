import type { Metadata } from "next";
import Script from "next/script";
import "../styles/index.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Strength and Yoga Coaching",
    template: "%s | Strength and Yoga Coaching",
  },
  description: "Strength and yoga coaching website",
  icons: {
    icon: [
      { url: "/icon", sizes: "32x32", type: "image/png" },
      { url: "/logos/logo-colour-icon-only.svg", type: "image/svg+xml" },
    ],
    shortcut: [{ url: "/icon", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
