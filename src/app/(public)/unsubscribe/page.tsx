import type { Metadata } from "next";
import { UnsubscribePage } from "@/views/unsubscribe";

export const metadata: Metadata = {
  title: { absolute: "Email Preferences | Shruti Turner" },
  description: "Manage your Shruti Turner newsletter subscription.",
  alternates: { canonical: "https://shrutiturner.co.uk/unsubscribe" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <UnsubscribePage />;
}
