import type { Metadata } from "next";
import { RetreatsPage } from "@/views/retreats";
import { buildPageMetadata } from "@/lib/content/metadata";
import { getFaqItemsFor } from "@/lib/content";
import { listOperationalRetreats } from "@/lib/retreats/service";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("retreats", "Retreats");
}

export default async function Page() {
  const [retreats, faqs] = await Promise.all([
    listOperationalRetreats(),
    getFaqItemsFor("retreats"),
  ]);
  return <RetreatsPage retreats={retreats} faqs={faqs} />;
}
