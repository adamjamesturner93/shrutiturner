import type { Metadata } from "next";
import { CoachingEnquirePage } from "@/views/coaching-enquire";
import { buildSeoMetadata } from "@/lib/content/metadata";

const COACHING_ENQUIRY_SOCIAL_IMAGE = "https://shrutiturner.co.uk/social/active";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    title: "Enquire About Coaching | Shruti Turner",
    absoluteTitle: true,
    description:
      "Tell me what you're looking for and we'll work out what level of support best fits your body, goals and real life.",
    canonicalUrl: "https://shrutiturner.co.uk/coaching/enquire",
    openGraphTitle: "Start a coaching conversation | Shruti Turner",
    openGraphDescription:
      "Tell me what you're looking for and we'll work out what level of support best fits your body, goals and real life.",
    image: COACHING_ENQUIRY_SOCIAL_IMAGE,
    imageAlt: "Shruti Turner coaching outdoors",
    noIndex: true,
    follow: true,
  });
}

export default function Page() {
  return <CoachingEnquirePage />;
}
