import type { Metadata } from "next";
import { UnsubscribePage } from "@/views/unsubscribe";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Manage your Shruti Turner newsletter subscription.",
  alternates: { canonical: "/unsubscribe" },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <UnsubscribePage />;
}
