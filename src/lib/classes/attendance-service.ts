import {
  AttendanceSource,
  ClassAttendanceEventType,
  ClassBookingStatus,
  ClassSessionStatus,
  Prisma,
} from "@prisma/client";
import { db } from "@/lib/db";

function getLateJoinCutoff(startsAtUtc: Date) {
  return new Date(startsAtUtc.getTime() + 5 * 60_000);
}

export async function getSessionAccessContext(sessionId: string, userId: string) {
  const [session, user] = await Promise.all([
    db.classSession.findUnique({
      where: { id: sessionId },
      include: {
        bookings: {
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
      },
    }),
  ]);

  if (!session || !user) {
    return null;
  }

  const booking = session.bookings[0] || null;
  const isAdmin = user.role === "admin";
  const isInstructor = session.instructorUserId === userId;
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.name || user.email;

  return {
    session,
    user,
    booking,
    isAdmin,
    isInstructor,
    isModerator: isAdmin || isInstructor,
    displayName,
    lateJoinCutoffAt: getLateJoinCutoff(session.startsAtUtc),
  };
}

export async function getRoomTokenAccess(sessionId: string, userId: string) {
  const access = await getSessionAccessContext(sessionId, userId);
  if (!access) {
    throw new Error("SESSION_NOT_FOUND");
  }

  if (!access.session.dailyRoomName || !access.session.dailyRoomUrl) {
    throw new Error("ROOM_NOT_READY");
  }

  if (access.session.status === ClassSessionStatus.cancelled) {
    throw new Error("ROOM_CLOSED");
  }

  if (access.isModerator) {
    return {
      roomName: access.session.dailyRoomName,
      roomUrl: access.session.dailyRoomUrl,
      userName: access.displayName,
      isOwner: true,
      lateJoinCutoffAt: access.lateJoinCutoffAt,
      hasPreviouslyJoined: true,
    };
  }

  const booking = access.booking;
  if (!booking || booking.status === ClassBookingStatus.cancelled) {
    throw new Error("FORBIDDEN");
  }

  const now = new Date();
  const hasPreviouslyJoined = Boolean(booking.firstJoinedAt);
  if (now > access.lateJoinCutoffAt && !hasPreviouslyJoined) {
    throw new Error("LATE_JOIN_CUTOFF");
  }

  if (
    ![ClassBookingStatus.booked, ClassBookingStatus.attended, ClassBookingStatus.no_show].includes(
      booking.status
    )
  ) {
    throw new Error("FORBIDDEN");
  }

  if (access.session.status === ClassSessionStatus.completed) {
    throw new Error("ROOM_CLOSED");
  }

  return {
    roomName: access.session.dailyRoomName,
    roomUrl: access.session.dailyRoomUrl,
    userName: access.displayName,
    isOwner: false,
    lateJoinCutoffAt: access.lateJoinCutoffAt,
    hasPreviouslyJoined,
  };
}

export async function recordAttendanceEvent(params: {
  sessionId: string;
  userId: string;
  type: "joined" | "left";
  dailyParticipantId?: string | null;
  occurredAt?: Date;
  payload?: Record<string, unknown> | null;
}) {
  const occurredAt = params.occurredAt || new Date();
  const booking = await db.classBooking.findFirst({
    where: {
      sessionId: params.sessionId,
      userId: params.userId,
      status: {
        in: [ClassBookingStatus.booked, ClassBookingStatus.attended, ClassBookingStatus.no_show],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  await db.classAttendanceEvent.create({
    data: {
      sessionId: params.sessionId,
      bookingId: booking?.id || null,
      userId: params.userId,
      dailyParticipantId: params.dailyParticipantId || null,
      type: params.type as ClassAttendanceEventType,
      occurredAt,
      payload: (params.payload as Prisma.InputJsonValue | undefined) || undefined,
    },
  });

  if (!booking) {
    return { bookingId: null };
  }

  if (params.type === "joined") {
    await db.classBooking.update({
      where: { id: booking.id },
      data: {
        firstJoinedAt: booking.firstJoinedAt || occurredAt,
        lastJoinedAt: occurredAt,
        joinCount: { increment: 1 },
        status: ClassBookingStatus.attended,
        attendanceSource: AttendanceSource.daily,
      },
    });
  } else {
    await db.classBooking.update({
      where: { id: booking.id },
      data: {
        lastLeftAt: occurredAt,
      },
    });
  }

  return { bookingId: booking.id };
}

export async function finalizeSessionNoShows(sessionId: string) {
  return db.classBooking.updateMany({
    where: {
      sessionId,
      status: ClassBookingStatus.booked,
      firstJoinedAt: null,
    },
    data: {
      status: ClassBookingStatus.no_show,
      attendanceSource: AttendanceSource.daily,
    },
  });
}

export async function setManualAttendanceStatus(params: {
  sessionId: string;
  bookingUserId: string;
  status: "booked" | "attended" | "no_show";
  markedByUserId: string;
}) {
  const booking = await db.classBooking.findFirst({
    where: {
      sessionId: params.sessionId,
      userId: params.bookingUserId,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  return db.classBooking.update({
    where: { id: booking.id },
    data: {
      status: params.status as ClassBookingStatus,
      attendanceMarkedAt: new Date(),
      attendanceMarkedByUserId: params.markedByUserId,
      attendanceSource: AttendanceSource.manual,
    },
  });
}

export async function setCommunityMode(params: { sessionId: string; enabled: boolean }) {
  return db.classSession.update({
    where: { id: params.sessionId },
    data: {
      communityModeEnabled: params.enabled,
      communityModeUpdatedAt: new Date(),
    },
  });
}
