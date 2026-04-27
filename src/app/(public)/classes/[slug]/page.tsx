import type { Metadata } from "next";
import { ClassDetailPage } from "@/views/class-detail";
import { buildSeoMetadata } from "@/lib/content/metadata";
import { getClassDefinitionBySlug, getClassDefinitions } from "@/lib/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cls = await getClassDefinitionBySlug(slug);

  if (!cls) {
    return buildSeoMetadata({ title: "Class Not Found", path: `/classes/${slug}`, noIndex: true });
  }

  return buildSeoMetadata({
    title: cls.seoTitle || cls.name,
    description: cls.seoDescription || cls.shortDescription,
    keywords: cls.seoKeywords,
    path: `/classes/${cls.slug}`,
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [classDetail, allClasses] = await Promise.all([
    getClassDefinitionBySlug(slug),
    getClassDefinitions(),
  ]);

  return <ClassDetailPage classDetail={classDetail} allClasses={allClasses} />;
}
