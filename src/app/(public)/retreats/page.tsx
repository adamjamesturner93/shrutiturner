import type { Metadata } from "next";
import { connection } from "next/server";
import { RetreatsPage } from "@/views/retreats";
import { buildPageMetadata } from "@/lib/content/metadata";
import { getFaqItemsFor } from "@/lib/content";
import { listOperationalRetreats } from "@/lib/retreats/service";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("retreats", "Retreats");
}

export default async function Page() {
  await connection();
  const [retreats, faqs] = await Promise.all([
    listOperationalRetreats(),
    getFaqItemsFor("retreats"),
  ]);
  return <RetreatsPage retreats={retreats} faqs={faqs} />;
}
