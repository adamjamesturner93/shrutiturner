import type { Metadata } from "next";
import { ClassesSmallGroupsPage } from "@/views/classes-small-groups";
import { buildPageMetadata } from "@/lib/content/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("classes-small-groups", "Small Group Programmes");
}

export default function Page() {
  return <ClassesSmallGroupsPage />;
}
