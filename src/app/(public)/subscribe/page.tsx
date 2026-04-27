import type { Metadata } from "next";
import { SubscribePage } from "@/views/subscribe";

export const metadata: Metadata = {
  title: "Subscribe",
  description: "Subscribe to Shruti Turner's newsletter.",
  alternates: { canonical: "/subscribe" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <SubscribePage />;
}
