import type { Metadata } from "next";
import { connection } from "next/server";
import { RetreatCheckoutPage } from "@/views/retreat-checkout";
import { getOperationalRetreatBySlug } from "@/lib/retreats/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const retreat = await getOperationalRetreatBySlug(id);

  if (!retreat) {
    return { title: "Checkout" };
  }

  return {
    title: `Book ${retreat.title}`,
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const retreat = await getOperationalRetreatBySlug(id);
  return <RetreatCheckoutPage retreat={retreat} />;
}
