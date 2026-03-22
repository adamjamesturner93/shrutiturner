import type { Metadata } from "next";
import { connection } from "next/server";
import { RetreatCheckoutPage } from "@/views/retreat-checkout";
import { getOperationalRetreatBySlug } from "@/lib/retreats/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const retreat = await getOperationalRetreatBySlug(slug);

  if (!retreat) {
    return { title: "Checkout" };
  }

  return {
    title: `Book ${retreat.title}`,
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const retreat = await getOperationalRetreatBySlug(slug);
  return <RetreatCheckoutPage retreat={retreat} />;
}
