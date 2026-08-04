import type { Metadata } from "next";
import { RetreatsPage } from "@/views/retreats";
import { listOperationalRetreats } from "@/lib/retreats/service";
import { JsonLd } from "@/components/json-ld";
import { createRetreatItemListSchema, createWebPageSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Retreats and online workshops | Shruti Turner",
  description:
    "Small, practical yoga retreats and online workshops with space for movement, rest and individual choice.",
  alternates: { canonical: "/retreats" },
  openGraph: {
    type: "website",
    title: "Retreats and online workshops | Shruti Turner",
    description:
      "Small, practical yoga retreats and online workshops with space for movement, rest and individual choice.",
  },
};

export default async function Page() {
  const retreats = await listOperationalRetreats();
  return (
    <>
      <JsonLd
        data={[
          createWebPageSchema({
            name: "Retreats and online workshops",
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
