import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RetreatDetailPage } from "@/views/retreat-detail";
import { getOperationalRetreatBySlug } from "@/lib/retreats/service";
import { JsonLd } from "@/components/json-ld";
import { createRetreatEventSchemas } from "@/lib/seo/structured-data";

type RetreatPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: RetreatPageProps): Promise<Metadata> {
  const { slug } = await params;
  const retreat = await getOperationalRetreatBySlug(slug);
  if (!retreat) return {};

  return {
    title: retreat.seoTitle || `${retreat.title} | Shruti Turner`,
    description: retreat.seoDescription || retreat.shortDescription,
    alternates: { canonical: `/retreats/${retreat.slug}` },
    openGraph: {
      type: "website",
      title: retreat.seoTitle || retreat.title,
      description: retreat.seoDescription || retreat.shortDescription,
      images: retreat.imageUrl ? [{ url: retreat.imageUrl, alt: retreat.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: retreat.seoTitle || retreat.title,
      description: retreat.seoDescription || retreat.shortDescription,
      images: retreat.imageUrl ? [retreat.imageUrl] : undefined,
    },
  };
}

export default async function Page({ params }: RetreatPageProps) {
  const { slug } = await params;
  const retreat = await getOperationalRetreatBySlug(slug);
  if (!retreat) notFound();
  return (
    <>
      <JsonLd data={createRetreatEventSchemas(retreat)} />
      <RetreatDetailPage retreat={retreat} />
    </>
  );
}
