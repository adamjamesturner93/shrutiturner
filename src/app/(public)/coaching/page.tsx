import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { buildPageMetadata } from "@/lib/content/metadata";
import { createServiceSchema, createWebPageSchema } from "@/lib/seo/structured-data";
import { CoachingPage } from "@/views/coaching";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("coaching", "1:1 Offers");
}

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          createWebPageSchema({
            name: "1:1 Offers",
            path: "/coaching",
            description:
              "Personalised movement and wellbeing support for bodies with fluctuating capacity.",
          }),
          createServiceSchema({
            name: "Shruti Turner 1:1 Offers",
            path: "/coaching",
            description:
              "Personalised training, guidance and 1:1 coaching support for chronic illness, pain, hypermobility and fluctuating capacity.",
            serviceType: "Personal training and wellbeing support",
          }),
        ]}
      />
      <CoachingPage />
    </>
  );
}
