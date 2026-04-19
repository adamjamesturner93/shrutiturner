import type { Metadata } from "next";
import Script from "next/script";
import "../styles/index.css";
import { Providers } from "./providers";
import { buildRootMetadata, getRuntimePlatformSettings } from "@/lib/platform/runtime-settings";

export async function generateMetadata(): Promise<Metadata> {
  return buildRootMetadata();
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const platformSettings = await getRuntimePlatformSettings();
  const gaMeasurementId = platformSettings.gaMeasurementId;

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
        {gaMeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaMeasurementId}', { anonymize_ip: true });`}
            </Script>
          </>
        ) : null}
        <Providers platformSettings={platformSettings}>{children}</Providers>
      </body>
    </html>
  );
}
