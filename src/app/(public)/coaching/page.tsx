import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { buildSeoMetadata } from "@/lib/content/metadata";
import { createServiceSchema, createWebPageSchema } from "@/lib/seo/structured-data";
import { CoachingPage } from "@/views/coaching";

const COACHING_SOCIAL_IMAGE = "https://shrutiturner.co.uk/social/active";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    title: "Online Personal Training & Coaching | Shruti Turner",
    absoluteTitle: true,
    description:
      "Personalised online training and movement coaching bringing together rehabilitation, fitness and wellbeing, with support built around your body, goals and real life.",
    canonicalUrl: "https://shrutiturner.co.uk/coaching",
    openGraphTitle: "Coaching that works with your body, not against it | Shruti Turner",
    openGraphDescription:
      "Personal online coaching that combines rehabilitation, fitness and wellbeing, with the level of support shaped around what you need.",
    image: COACHING_SOCIAL_IMAGE,
    imageAlt: "Shruti Turner coaching outdoors",
    keywords: [
      "online personal training",
      "movement coaching",
      "rehabilitation",
      "strength training",
      "personalised coaching",
    ],
  });
}

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          createWebPageSchema({
            name: "Online Personal Training & Coaching",
            path: "/coaching",
            description:
              "Personalised movement and wellbeing support built around your body, goals and real life.",
          }),
          createServiceSchema({
            name: "Shruti Turner Online Personal Training & Coaching",
            path: "/coaching",
            description:
              "Personalised training, guidance and coaching bringing together rehabilitation, fitness and wellbeing.",
            serviceType: "Personal training and wellbeing support",
          }),
        ]}
      />
      <CoachingPage />
    </>
  );
}
