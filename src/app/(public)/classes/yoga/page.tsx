import type { Metadata } from "next";
import { ClassesYogaPage } from "@/views/classes-yoga";
import { buildPageMetadata } from "@/lib/content/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("classes-yoga", "Yoga Classes");
}

export default function Page() {
  return <ClassesYogaPage />;
}
