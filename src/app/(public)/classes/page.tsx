import type { Metadata } from "next";
import { ClassesHubPage } from "@/views/classes-hub";
import { buildPageMetadata } from "@/lib/content/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("classes", "Classes");
}

export default function Page() {
  return <ClassesHubPage />;
}
