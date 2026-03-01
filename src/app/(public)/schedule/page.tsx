import type { Metadata } from "next";
import { SchedulePage } from "@/views/schedule";
import { buildPageMetadata } from "@/lib/content/metadata";
import { getScheduleByDayContent } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("schedule", "Schedule");
}

export default async function Page() {
  const scheduleData = await getScheduleByDayContent();
  return <SchedulePage scheduleData={scheduleData} />;
}
