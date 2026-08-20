import type { Metadata } from "next";
import { RetreatsPage } from "@/views/retreats";
import { listOperationalRetreats } from "@/lib/retreats/service";
import { JsonLd } from "@/components/json-ld";
import { createRetreatItemListSchema, createWebPageSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Movement Retreats & Online Workshops",
  description:
    "Small-group retreats and online workshops bringing together movement, strength and wellbeing, with adaptable sessions and practical ideas you can take into everyday life.",
  alternates: { canonical: "/retreats" },
  openGraph: {
    type: "website",
    title: "Movement Retreats & Online Workshops | Shruti Turner",
    description:
      "Small-group retreats and online workshops bringing together movement, strength and wellbeing, with adaptable sessions and practical ideas you can take into everyday life.",
    url: "https://shrutiturner.co.uk/retreats",
  },
};

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
      <RetreatsPage retreats={retreats} />
    </>
  );
}
