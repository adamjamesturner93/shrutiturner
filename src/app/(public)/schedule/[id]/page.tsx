import type { Metadata } from "next";
import { ClassDetailPage } from "@/views/class-detail";
import { getClassDefinitionBySlug, getClassDefinitions } from "@/lib/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const cls = await getClassDefinitionBySlug(id);

  if (!cls) {
    return { title: "Class Not Found" };
  }

  return {
    title: cls.seoTitle || cls.name,
    description: cls.seoDescription || cls.shortDescription,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [classDetail, allClasses] = await Promise.all([
    getClassDefinitionBySlug(id),
    getClassDefinitions(),
  ]);

  return <ClassDetailPage classDetail={classDetail} allClasses={allClasses} />;
}
