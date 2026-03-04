import type { Metadata } from "next";
import { RetreatDetailPage } from "@/views/retreat-detail";
import { getRetreatBySlugCombined, getRetreatsCombined } from "@/lib/content";

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

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const retreat = await getRetreatBySlugCombined(id);
  const allRetreats = await getRetreatsCombined();
  const otherRetreatsAtVenue = retreat
    ? allRetreats.filter((item) => {
        if (item.slug === retreat.slug) return false;
        if (retreat.venueId && item.venueId) return item.venueId === retreat.venueId;
        if (retreat.venueSlug && item.venueSlug) return item.venueSlug === retreat.venueSlug;
        return item.location === retreat.location;
      })
    : [];

  return <RetreatDetailPage retreat={retreat} otherRetreatsAtVenue={otherRetreatsAtVenue} />;
}
