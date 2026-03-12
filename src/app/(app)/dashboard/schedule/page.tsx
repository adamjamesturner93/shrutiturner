import { DashboardSchedule } from "@/views/dashboard/schedule";
import { auth } from "@/lib/auth";
import { getScheduleGroupedByDay } from "@/lib/classes/session-service";

export const dynamic = "force-dynamic";

function getScheduleWindow(weekOffset: number) {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  if (weekOffset === 0) {
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(start.getDate() + diffToMonday + weekOffset * 7);
    start.setHours(0, 0, 0, 0);
  }

  const end = new Date(start);
  if (weekOffset === 0) {
    const nextMonday = new Date(start);
    nextMonday.setDate(nextMonday.getDate() + (day === 0 ? 1 : 8 - day));
    nextMonday.setHours(0, 0, 0, 0);
    end.setTime(nextMonday.getTime());
  } else {
    end.setDate(end.getDate() + 7);
  }

  return { start, end };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ wk?: string }>;
}) {
  const params = await searchParams;
  const parsed = Number.parseInt(params.wk || "0", 10);
  const weekOffset = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  const { start, end } = getScheduleWindow(weekOffset);
  const session = await auth();
  const initialSchedule = await getScheduleGroupedByDay({
    currentUserId: session?.user?.id,
    from: start,
    to: end,
  });

  return <DashboardSchedule initialSchedule={initialSchedule} initialWeekOffset={weekOffset} />;
}
