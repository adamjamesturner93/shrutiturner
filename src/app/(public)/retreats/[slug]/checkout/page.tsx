import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RetreatCheckoutPage } from "@/views/retreat-checkout";
import { getOperationalRetreatBySlug } from "@/lib/retreats/service";

export const metadata: Metadata = {
  title: "Retreat checkout",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const retreat = await getOperationalRetreatBySlug(slug);
  if (!retreat) notFound();
  return <RetreatCheckoutPage retreat={retreat} />;
}
