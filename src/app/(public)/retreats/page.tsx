import type { Metadata } from "next";
import { RetreatsPage } from "@/views/retreats";
import { buildPageMetadata } from "@/lib/content/metadata";
import { getFaqItemsFor, getRetreatsCombined } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("retreats", "Retreats");
}

export default async function Page() {
  const [retreats, faqs] = await Promise.all([getRetreatsCombined(), getFaqItemsFor("retreats")]);
  return <RetreatsPage retreats={retreats} faqs={faqs} />;
}
