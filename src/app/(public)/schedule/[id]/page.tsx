import type { Metadata } from "next";
import { ClassDetailPage } from "@/views/class-detail";
import { buildSeoMetadata } from "@/lib/content/metadata";
import { getClassDefinitionBySlug, getClassDefinitions } from "@/lib/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const cls = await getClassDefinitionBySlug(id);

  if (!cls) {
    return buildSeoMetadata({ title: "Class Not Found", path: `/schedule/${id}`, noIndex: true });
  }

  return buildSeoMetadata({
    title: cls.seoTitle || cls.name,
    description: cls.seoDescription || cls.shortDescription,
    keywords: cls.seoKeywords,
    path: `/schedule/${cls.slug}`,
  });
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [classDetail, allClasses] = await Promise.all([
    getClassDefinitionBySlug(id),
    getClassDefinitions(),
  ]);

  return <ClassDetailPage classDetail={classDetail} allClasses={allClasses} />;
}
