import type { Metadata } from "next";
import { ClassesYogaPage } from "@/views/classes-yoga";
import { buildPageMetadata } from "@/lib/content/metadata";
import { getClassDefinitionsByCategory, getTestimonials } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("classes-yoga", "Yoga Classes");
}

export default async function Page() {
  const [classDefinitions, testimonials] = await Promise.all([
    getClassDefinitionsByCategory("yoga"),
    getTestimonials("yoga"),
  ]);

  return <ClassesYogaPage classDefinitions={classDefinitions} testimonials={testimonials} />;
}
