import { cacheLife } from "next/cache";
import type { RetreatCombinedContent } from "@/lib/content/types";
import { selectNextPublicExperience } from "@/lib/retreats/discovery";
import { getRetreatOverviewTestimonials } from "@/lib/content/testimonials";
import type { Metadata } from "next";
import { RetreatsPage } from "@/views/retreats";
import { listOperationalRetreats } from "@/lib/retreats/service";
import { JsonLd } from "@/components/json-ld";
import { createRetreatItemListSchema, createWebPageSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Movement Retreats & Online Workshops",
  description:
    "Small-group retreats and online workshops bringing together movement, strength and wellbeing, with adaptable sessions and practical ideas you can take into everyday life.",
  alternates: { canonical: "https://shrutiturner.co.uk/retreats" },
  twitter: {
    card: "summary_large_image",
    title: "Movement Retreats & Online Workshops | Shruti Turner",
    description:
      "Small-group retreats and online workshops bringing together movement, strength and wellbeing, with adaptable sessions and practical ideas you can take into everyday life.",
    images: ["https://shrutiturner.co.uk/social/active"],
  },
  openGraph: {
    type: "website",
    title: "Movement Retreats & Online Workshops | Shruti Turner",
    description:
      "Small-group retreats and online workshops bringing together movement, strength and wellbeing, with adaptable sessions and practical ideas you can take into everyday life.",
    url: "https://shrutiturner.co.uk/retreats",
    images: ["https://shrutiturner.co.uk/social/active"],
  },
};

async function getNextEventDateId(retreats: RetreatCombinedContent[]) {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  return selectNextPublicExperience(retreats)?.date.id;
}

export default async function Page() {
  const retreats = await listOperationalRetreats();
  return (
    <>
      <JsonLd
        data={[
          createWebPageSchema({
            name: "Movement Retreats & Online Workshops",
            path: "/retreats",
            description: metadata.description || undefined,
            type: "CollectionPage",
          }),
          createRetreatItemListSchema(retreats),
        ]}
      />
      <RetreatsPage
        retreats={retreats}
        nextEventDateId={await getNextEventDateId(retreats)}
        testimonials={await getRetreatOverviewTestimonials()}
      />
    </>
  );
}
