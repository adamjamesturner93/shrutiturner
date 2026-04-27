import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { PricingPage } from "@/views/pricing";
import { buildPageMetadata } from "@/lib/content/metadata";
import { getFaqItemsFor } from "@/lib/content";
import { createFaqPageSchema, createWebPageSchema } from "@/lib/seo/structured-data";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("pricing", "Pricing");
}

export default async function Page() {
  const faqs = await getFaqItemsFor("pricing");
  return (
    <>
      <JsonLd
        data={[
          createWebPageSchema({
            name: "Pricing",
            path: "/pricing",
            description: "Pricing for coaching, classes, and memberships.",
          }),
          createFaqPageSchema(faqs),
        ]}
      />
      <PricingPage faqs={faqs} />
    </>
  );
}
