import type { Metadata } from "next";
import { connection } from "next/server";
import { JsonLd } from "@/components/json-ld";
import { RetreatDetailPage } from "@/views/retreat-detail";
import { buildSeoMetadata } from "@/lib/content/metadata";
import { getRetreatsCombined } from "@/lib/content";
import { getOperationalRetreatBySlug } from "@/lib/retreats/service";
import { createBreadcrumbListSchema, createRetreatEventSchema } from "@/lib/seo/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const retreat = await getOperationalRetreatBySlug(slug);

  if (!retreat) {
    return buildSeoMetadata({
      title: "Retreat Not Found",
      path: `/retreats/${slug}`,
      noIndex: true,
    });
  }

  return buildSeoMetadata({
    title: retreat.title,
    description: retreat.shortDescription,
    path: `/retreats/${retreat.slug}`,
    keywords: ["yoga retreat", "wellness retreat", "adaptive yoga retreat"],
  });
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

  return (
    <>
      {retreat ? (
        <JsonLd
          data={[
            createRetreatEventSchema(retreat),
            createBreadcrumbListSchema([
              { name: "Home", path: "/" },
              { name: "Retreats", path: "/retreats" },
              { name: retreat.title, path: `/retreats/${retreat.slug}` },
            ]),
          ]}
        />
      ) : null}
      <RetreatDetailPage retreat={retreat} otherRetreatsAtVenue={otherRetreatsAtVenue} />
    </>
  );
}
