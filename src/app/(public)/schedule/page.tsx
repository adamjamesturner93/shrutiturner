import type { Metadata } from "next";
import { SchedulePage } from "@/views/schedule";
import { buildPageMetadata } from "@/lib/content/metadata";
import { auth } from "@/lib/auth";
import { getScheduleGroupedByDay } from "@/lib/classes/session-service";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("schedule", "Schedule");
}

export default async function Page() {
  const session = await auth();
  const from = new Date();
  const to = new Date(from.getTime() + 7 * 86400000);
  const scheduleData = await getScheduleGroupedByDay({
    currentUserId: session?.user?.id,
    from,
    to,
  });
  return <SchedulePage scheduleData={scheduleData} />;
}
