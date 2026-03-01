import type { Metadata } from "next";
import "../styles/index.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Strength and Yoga Coaching",
    template: "%s | Strength and Yoga Coaching",
  },
  description: "Strength and yoga coaching website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
