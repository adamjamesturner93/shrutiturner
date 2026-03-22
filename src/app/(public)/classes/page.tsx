import type { Metadata } from "next";
import { connection } from "next/server";
import { ClassesHubPage } from "@/views/classes-hub";
import { buildPageMetadata } from "@/lib/content/metadata";
import { getClassDefinitions } from "@/lib/content";
import type { ClassDefinitionContent } from "@/lib/content";
import { listPublicThemedWeeks } from "@/lib/themed-weeks/service";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("classes", "Move Well Classes");
}

function sortClasses(items: ClassDefinitionContent[]) {
  const dayOrder = new Map([
    ["Monday", 1],
    ["Tuesday", 2],
    ["Wednesday", 3],
    ["Thursday", 4],
    ["Friday", 5],
    ["Saturday", 6],
    ["Sunday", 7],
  ]);

  return [...items].sort((a, b) => {
    const dayDiff = (dayOrder.get(a.day) || 99) - (dayOrder.get(b.day) || 99);
    if (dayDiff !== 0) return dayDiff;
    return a.time.localeCompare(b.time);
  });
}

export default async function Page() {
  await connection();
  const [classDefinitions, themedWeeks] = await Promise.all([
    getClassDefinitions(),
    listPublicThemedWeeks(),
  ]);

  const yogaClasses = sortClasses(
    classDefinitions.filter((item) => item.type === "Yoga" || item.classCategory === "yoga")
  );
  const strengthClasses = sortClasses(
    classDefinitions.filter(
      (item) =>
        item.type === "Strength" || item.type === "HIIT" || item.classCategory === "strength"
    )
  );

  return (
    <ClassesHubPage
      yogaClasses={yogaClasses}
      strengthClasses={strengthClasses}
      themedWeeks={themedWeeks}
    />
  );
}
