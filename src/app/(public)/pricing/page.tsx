import type { Metadata } from "next";
import { PricingPage } from "@/views/pricing";
import { buildPageMetadata } from "@/lib/content/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("pricing", "Pricing");
}

export default function Page() {
  return <PricingPage />;
}
