import { Suspense } from "react";
import { isHoldingStage } from "@/lib/site-stage";
import { validPolicyDate } from "@/lib/analytics/policy";
import type { Metadata } from "next";
import { AnalyticsProvider } from "@/components/analytics/provider";
import Script from "next/script";
import { Inter, Libre_Baskerville } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../styles/index.css";
import { Providers } from "./providers";
import { env } from "@/lib/env";
import { buildRootMetadata, getRuntimePlatformSettings } from "@/lib/platform/runtime-settings";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-libre-baskerville",
});

export async function generateMetadata(): Promise<Metadata> {
  return buildRootMetadata();
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const platformSettings = await getRuntimePlatformSettings();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${libreBaskerville.variable}`}
    >
      <body>
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
        <Providers platformSettings={platformSettings}>
          {children}
          <Suspense fallback={null}>
            <AnalyticsProvider
              productionDeployment={
                !isHoldingStage() &&
                env.NODE_ENV === "production" &&
                env.VERCEL_ENV === "production" &&
                validPolicyDate(process.env.ANALYTICS_POLICY_EFFECTIVE_DATE)
              }
            />
          </Suspense>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
