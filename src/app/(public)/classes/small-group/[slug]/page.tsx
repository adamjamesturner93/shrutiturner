import type { Metadata } from "next";
import { connection } from "next/server";
import { buildPageMetadata } from "@/lib/content/metadata";
import { getPublicSmallGroupProgrammeBySlug } from "@/lib/small-groups/service";
import { ClassesSmallGroupDetailPage } from "@/views/classes-small-group-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const programme = await getPublicSmallGroupProgrammeBySlug(slug);
  return buildPageMetadata(
    "classes-small-groups",
    programme ? `${programme.title} - Small Group Programme` : "Small Group Programme"
  );
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const programme = await getPublicSmallGroupProgrammeBySlug(slug);
  return <ClassesSmallGroupDetailPage programme={programme} />;
}
