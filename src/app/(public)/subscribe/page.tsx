import type { Metadata } from "next";
import { SubscribePage } from "@/views/subscribe";
import { FREE_GUIDE_META_DESCRIPTION } from "@/lib/newsletter/lead-magnet";

export const metadata: Metadata = {
  title: "Newsletter & Free Guide",
  description: FREE_GUIDE_META_DESCRIPTION,
  alternates: { canonical: "https://shrutiturner.co.uk/subscribe" },
  openGraph: {
    type: "website",
    url: "https://shrutiturner.co.uk/subscribe",
    title: "Newsletter & Free Guide",
    description: FREE_GUIDE_META_DESCRIPTION,
    images: ["https://shrutiturner.co.uk/social/active"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Newsletter & Free Guide",
    description: FREE_GUIDE_META_DESCRIPTION,
    images: ["https://shrutiturner.co.uk/social/active"],
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <SubscribePage />;
}
