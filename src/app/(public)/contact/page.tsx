import type { Metadata } from "next";
import { ContactPage } from "@/views/contact";
import { buildSeoMetadata } from "@/lib/content/metadata";

const CONTACT_SOCIAL_IMAGE = "https://shrutiturner.co.uk/social/about";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    title: "Contact Shruti Turner | Movement & Fitness Coaching",
    absoluteTitle: true,
    description:
      "Get in touch with Shruti Turner about coaching, workshops, retreats, accessibility, collaborations or general movement and fitness enquiries.",
    canonicalUrl: "https://shrutiturner.co.uk/contact",
    openGraphTitle: "Get in touch | Shruti Turner",
    openGraphDescription:
      "Questions about coaching, workshops, retreats or something else? Send Shruti a message.",
    image: CONTACT_SOCIAL_IMAGE,
    imageAlt: "Shruti Turner outdoors",
    keywords: [
      "contact Shruti Turner",
      "movement coaching",
      "fitness coaching",
      "workshops",
      "retreats",
    ],
  });
}

export default function Page() {
  return <ContactPage />;
}
