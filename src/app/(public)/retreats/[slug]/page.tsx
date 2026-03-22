import type { Metadata } from "next";
import { connection } from "next/server";
import { RetreatDetailPage } from "@/views/retreat-detail";
import { getRetreatsCombined } from "@/lib/content";
import { getOperationalRetreatBySlug } from "@/lib/retreats/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const retreat = await getOperationalRetreatBySlug(slug);

  if (!retreat) {
    return { title: "Retreat Not Found" };
  }

  return {
    title: retreat.title,
    description: retreat.shortDescription,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const retreat = await getOperationalRetreatBySlug(slug);
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
