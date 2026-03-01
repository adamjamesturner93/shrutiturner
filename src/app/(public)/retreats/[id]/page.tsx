import type { Metadata } from "next";
import { RetreatDetailPage } from "@/views/retreat-detail";
import { getRetreatBySlugCombined } from "@/lib/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const retreat = await getRetreatBySlugCombined(id);

  if (!retreat) {
    return { title: "Retreat Not Found" };
  }

  return {
    title: retreat.title,
    description: retreat.shortDescription,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const retreat = await getRetreatBySlugCombined(id);
  return <RetreatDetailPage retreat={retreat} />;
}
