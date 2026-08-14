import type { Metadata } from "next";
import { RetreatsPage } from "@/views/retreats";
import { listOperationalRetreats } from "@/lib/retreats/service";
import { JsonLd } from "@/components/json-ld";
import { createRetreatItemListSchema, createWebPageSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Movement Retreats & Online Workshops",
  description:
    "Movement retreats and online workshops with space to move, rest and reflect, designed to work with different bodies, needs and energy levels.",
  alternates: { canonical: "/retreats" },
  openGraph: {
    type: "website",
    title: "Movement Retreats & Online Workshops | Shruti Turner",
    description:
      "Movement retreats and online workshops with space to move, rest and reflect, designed to work with different bodies, needs and energy levels.",
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
