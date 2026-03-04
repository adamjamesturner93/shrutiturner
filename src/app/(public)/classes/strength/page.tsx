import type { Metadata } from "next";
import { ClassesStrengthPage } from "@/views/classes-strength";
import { buildPageMetadata } from "@/lib/content/metadata";
import { getClassDefinitionsByCategory, getTestimonials } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("classes-strength", "Strength Classes");
}

export default async function Page() {
  const [classDefinitions, testimonials] = await Promise.all([
    getClassDefinitionsByCategory("strength"),
    getTestimonials("strength"),
  ]);

  return <ClassesStrengthPage classDefinitions={classDefinitions} testimonials={testimonials} />;
}
