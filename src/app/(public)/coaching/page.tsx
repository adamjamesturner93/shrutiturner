import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { buildPageMetadata } from "@/lib/content/metadata";
import { createServiceSchema, createWebPageSchema } from "@/lib/seo/structured-data";
import { CoachingPage } from "@/views/coaching";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("coaching", "Coaching");
}

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          createWebPageSchema({
            name: "Coaching",
            path: "/coaching",
            description:
              "Personalised strength and yoga coaching for complex bodies and fluctuating capacity.",
          }),
          createServiceSchema({
            name: "Strength and Yoga Coaching",
            path: "/coaching",
            description:
              "Personalised training and coaching support for chronic illness, pain, hypermobility, and complex bodies.",
            serviceType: "Health coaching",
          }),
        ]}
      />
      <CoachingPage />
    </>
  );
}
