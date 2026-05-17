import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { ClassDetailPage } from "@/views/class-detail";
import { buildSeoMetadata } from "@/lib/content/metadata";
import {
  getClassDefinitionBySlug,
  getClassDefinitions,
  getContentSource,
  getInstructorProfilesByIds,
} from "@/lib/content";
import { createBreadcrumbListSchema, createClassCourseSchema } from "@/lib/seo/structured-data";

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
  const isContentfulSource = getContentSource() === "contentful";
  const instructorProfileEntryId = classDetail?.defaultInstructorProfileEntryId;

  if (classDetail && isContentfulSource && !instructorProfileEntryId) {
    throw new Error(
      `CONTENTFUL_CONTENT_MISSING: classDefinition "${classDetail.slug}" is missing defaultInstructorProfile`
    );
  }

  const instructorProfile = instructorProfileEntryId
    ? (await getInstructorProfilesByIds([instructorProfileEntryId]))[0] || null
    : null;

  if (classDetail && isContentfulSource && !instructorProfile) {
    throw new Error(
      `CONTENTFUL_CONTENT_MISSING: classDefinition "${classDetail.slug}" linked instructorProfile "${instructorProfileEntryId}" was not found`
    );
  }

  return (
    <>
      {classDetail ? (
        <JsonLd
          data={[
            createClassCourseSchema(classDetail),
            createBreadcrumbListSchema([
              { name: "Home", path: "/" },
              { name: "Classes", path: "/classes" },
              { name: classDetail.name, path: `/classes/${classDetail.slug}` },
            ]),
          ]}
        />
      ) : null}
      <ClassDetailPage
        classDetail={classDetail}
        allClasses={allClasses}
        instructorProfile={instructorProfile}
      />
    </>
  );
}
