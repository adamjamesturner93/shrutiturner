import type { Metadata } from "next";
import { ClassesStrengthPage } from "@/views/classes-strength";
import { buildPageMetadata } from "@/lib/content/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("classes-strength", "Strength Classes");
}

export default function Page() {
  return <ClassesStrengthPage />;
}
