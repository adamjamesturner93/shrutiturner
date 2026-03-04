import type { Metadata } from "next";
import { PricingPage } from "@/views/pricing";
import { buildPageMetadata } from "@/lib/content/metadata";
import { getFaqItemsFor } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("pricing", "Pricing");
}

export default async function Page() {
  const faqs = await getFaqItemsFor("pricing");
  return <PricingPage faqs={faqs} />;
}
