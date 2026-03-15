import type { Metadata } from "next";
import { connection } from "next/server";
import { ClassesSmallGroupsPage } from "@/views/classes-small-groups";
import { buildPageMetadata } from "@/lib/content/metadata";
import { listSmallGroupCatalogue } from "@/lib/small-groups/service";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("classes-small-groups", "Small Group Programmes");
}

export default async function Page() {
  await connection();
  const programmes = await listSmallGroupCatalogue();
  return <ClassesSmallGroupsPage programmes={programmes} />;
}
