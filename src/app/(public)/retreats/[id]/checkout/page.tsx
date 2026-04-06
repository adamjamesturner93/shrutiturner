import type { Metadata } from "next";
import { RetreatCheckoutPage } from "@/views/retreat-checkout";
import { getRetreatBySlug } from "@/data/retreat-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const retreat = getRetreatBySlug(id);

  if (!retreat) {
    return { title: "Checkout" };
  }

  return {
    title: `Book ${retreat.title}`,
    robots: { index: false, follow: false },
  };
}

export default function Page() {
  return <RetreatCheckoutPage />;
}
