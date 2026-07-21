import { notFound } from "next/navigation";
import { RetreatDetailPage } from "@/views/retreat-detail";
import { getOperationalRetreatBySlug } from "@/lib/retreats/service";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const retreat = await getOperationalRetreatBySlug(slug);
  if (!retreat) notFound();
  return <RetreatDetailPage retreat={retreat} />;
}
