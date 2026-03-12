import { ClassBookingStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { AdminDashboardSummaryDto } from "@/lib/api/types";

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummaryDto> {
  const now = new Date();
  const startToday = new Date(now);
  startToday.setUTCHours(0, 0, 0, 0);
  const endToday = new Date(startToday);
  endToday.setUTCDate(endToday.getUTCDate() + 1);

  const [todaySessions, upcomingSessions, trendsWindowSessions] = await Promise.all([
    db.classSession.findMany({
      where: { startsAtUtc: { gte: startToday, lt: endToday } },
      include: {
        bookings: {
          where: { status: ClassBookingStatus.booked },
          select: { id: true },
        },
      },
      orderBy: { startsAtUtc: "asc" },
    }),
    db.classSession.findMany({
      where: {
        startsAtUtc: { gte: now },
      },
      include: {
        bookings: {
          where: { status: ClassBookingStatus.booked },
          select: { id: true },
        },
      },
      orderBy: { startsAtUtc: "asc" },
      take: 10,
    }),
    db.classSession.findMany({
      where: {
        startsAtUtc: { gte: new Date(Date.now() - 7 * 86400000) },
      },
      include: {
        bookings: {
          select: { status: true },
        },
      },
      orderBy: { startsAtUtc: "asc" },
    }),
  ]);

  const todayBooked = todaySessions.reduce((sum, session) => sum + session.bookings.length, 0);
  const todayCapacity = todaySessions.reduce((sum, session) => sum + session.capacity, 0);

  const nearFull = upcomingSessions
    .filter((session) => session.bookings.length >= Math.max(1, session.capacity - 2))
    .slice(0, 5)
    .map((session) => ({
      id: session.id,
      title: session.titleSnapshot,
      type: session.typeSnapshot,
      startsAtUtc: session.startsAtUtc.toISOString(),
      bookedCount: session.bookings.length,
      capacity: session.capacity,
    }));

  const trendsByDay = new Map<string, { booked: number; attended: number }>();
  for (const session of trendsWindowSessions) {
    const day = session.startsAtUtc.toISOString().slice(0, 10);
    if (!trendsByDay.has(day)) {
      trendsByDay.set(day, { booked: 0, attended: 0 });
    }
    const bucket = trendsByDay.get(day)!;
    bucket.booked += session.bookings.filter((booking) => booking.status === ClassBookingStatus.booked).length;
    bucket.attended += session.bookings.filter((booking) => booking.status === ClassBookingStatus.attended).length;
  }

  return {
    today: {
      date: startToday.toISOString().slice(0, 10),
      sessions: todaySessions.length,
      liveNow: todaySessions.filter((session) => session.status === "live").length,
      booked: todayBooked,
      capacity: todayCapacity,
    },
    upcoming: upcomingSessions.map((session) => ({
      id: session.id,
      title: session.titleSnapshot,
      type: session.typeSnapshot,
      startsAtUtc: session.startsAtUtc.toISOString(),
      durationMinutes: session.durationMinutes,
      bookedCount: session.bookings.length,
      capacity: session.capacity,
      status: session.status,
    })),
    nearFull,
    trends: Array.from(trendsByDay.entries())
      .sort((a, b) => (a[0] > b[0] ? 1 : -1))
      .map(([date, values]) => ({
        date,
        booked: values.booked,
        attended: values.attended,
      })),
  };
}
