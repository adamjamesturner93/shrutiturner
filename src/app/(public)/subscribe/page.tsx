import type { Metadata } from "next";
import { SubscribePage } from "@/views/subscribe";
import { FREE_GUIDE_META_DESCRIPTION } from "@/lib/newsletter/lead-magnet";

export const metadata: Metadata = {
  title: "Newsletter & Free Guide",
  description: FREE_GUIDE_META_DESCRIPTION,
  alternates: { canonical: "/subscribe" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <SubscribePage />;
}
