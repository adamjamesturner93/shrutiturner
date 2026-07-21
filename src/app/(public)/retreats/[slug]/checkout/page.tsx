import { notFound } from "next/navigation";
import { RetreatCheckoutPage } from "@/views/retreat-checkout";
import { getOperationalRetreatBySlug } from "@/lib/retreats/service";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const retreat = await getOperationalRetreatBySlug(slug);
  if (!retreat) notFound();
  return <RetreatCheckoutPage retreat={retreat} />;
}
