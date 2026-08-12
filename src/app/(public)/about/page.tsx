import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/content/metadata";
import { AboutPage } from "@/views/about";

// Temporary social-sharing image until a dedicated 1200 × 630 asset is supplied.
const ABOUT_SOCIAL_IMAGE_PLACEHOLDER = "https://shrutiturner.co.uk/images/shruti.jpeg";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    title: "About Shruti Turner | Personal Trainer & Rehabilitation PhD",
    absoluteTitle: true,
    description:
      "Meet Shruti Turner, a Personal Trainer, yoga teacher and rehabilitation researcher bringing together research, coaching and lived experience to support movement and strength.",
    canonicalUrl: "https://shrutiturner.co.uk/about",
    openGraphTitle: "Meet Shruti Turner | Research, Coaching & Lived Experience",
    openGraphDescription:
      "Discover the research, coaching experience and lived experience behind Shruti Turner's approach to rehabilitation, fitness and wellbeing.",
    image: ABOUT_SOCIAL_IMAGE_PLACEHOLDER,
    imageAlt: "Shruti Turner outdoors in the mountains",
    keywords: [
      "Shruti Turner",
      "personal trainer",
      "rehabilitation research",
      "movement coaching",
      "yoga teacher",
    ],
  });
}

export default function Page() {
  return <AboutPage />;
}
