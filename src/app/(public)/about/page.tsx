import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/content/metadata";
import { AboutPage } from "@/views/about";

const ABOUT_SOCIAL_IMAGE = "https://shrutiturner.co.uk/social/about";

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
    image: ABOUT_SOCIAL_IMAGE,
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
