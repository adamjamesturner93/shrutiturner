import type { Metadata } from "next";
import { ClassesSmallGroupsPage } from "@/views/classes-small-groups";
import { buildPageMetadata } from "@/lib/content/metadata";
import { getClassDefinitionsByCategory, getTestimonials } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("classes-small-groups", "Small Group Programmes");
}

export default async function Page() {
  const [classDefinitions, testimonials] = await Promise.all([
    getClassDefinitionsByCategory("small-group"),
    getTestimonials("small-group"),
  ]);

  return <ClassesSmallGroupsPage classDefinitions={classDefinitions} testimonials={testimonials} />;
}
