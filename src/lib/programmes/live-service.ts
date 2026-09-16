import "server-only";
import { db } from "@/lib/db";
import {
  createSessionRoom,
  createMeetingToken,
  getRecordingAccessLink,
  startRoomRecording,
  stopRoomRecording,
} from "@/lib/daily/service";
import { programmeAccess, requireCohortStaff } from "./access";
import { cohortStateAt } from "./policy";

export async function getProgrammeLiveToken(userId: string, cohortId: string, sessionId: string) {
  const access = await programmeAccess(userId, cohortId, "exercise");
  const { cohort, now, staff } = access;
  const session = cohort.sessions.find((s) => s.id === sessionId);
  if (!session || !session.endsAt) throw new Error("NOT_FOUND");
  if (
    session.status !== "scheduled" ||
    !["active", "confirmed"].includes(cohortStateAt(cohort, now)) ||
    now < new Date(session.startsAt.getTime() - 15 * 60000) ||
    now >= session.endsAt ||
    !cohort.liveCoachingEndsAt ||
    now >= cohort.liveCoachingEndsAt
  )
    throw new Error("LIVE_NOT_OPEN");
  let roomName = session.dailyRoomName;
  let roomUrl = session.dailyRoomUrl;
  if (!roomName || !roomUrl) {
    const room = await createSessionRoom(
      `programme-${session.id}`,
      session.startsAt,
      session.endsAt,
      { maxParticipants: (cohort.maximumParticipants || 10) + 3, recording: true }
    );
    roomName = room.roomName;
    roomUrl = room.roomUrl;
    await db.smallGroupProgrammeSession.update({
      where: { id: session.id },
      data: { dailyRoomName: roomName, dailyRoomUrl: roomUrl },
    });
  }
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const token = await createMeetingToken({
    roomName,
    userId,
    userName: user.firstName || "Participant",
    isOwner: staff,
    expiresAt: session.endsAt,
  });
  return { roomUrl, token, title: session.title };
}
export async function programmeRecording(
  actorId: string,
  cohortId: string,
  sessionId: string,
  action: "start" | "stop"
) {
  const c = await requireCohortStaff(actorId, cohortId);
  const session = c.sessions.find((s) => s.id === sessionId);
  if (!session?.dailyRoomName) throw new Error("OPEN_LIVE_ROOM_FIRST");
  if (action === "stop") return stopRoomRecording(session.dailyRoomName);
  const result = await startRoomRecording(session.dailyRoomName);
  const existing = await db.replayAsset.findFirst({
    where: {
      smallGroupProgrammeSessionId: session.id,
      dailyRoomName: session.dailyRoomName,
      ...(result.id ? { dailyRecordingId: result.id } : { status: "processing" }),
    },
  });
  if (!existing)
    await db.replayAsset.create({
      data: {
        resourceType: "small_group_programme_session",
        smallGroupProgrammeId: c.id,
        smallGroupProgrammeSessionId: session.id,
        dailyRoomName: session.dailyRoomName,
        dailyRecordingId: result.id || null,
        status: "processing",
      },
    });
  return { started: true };
}
export async function programmeReplayAccess(userId: string, cohortId: string, replayId: string) {
  const { cohort, staff, now } = await programmeAccess(userId, cohortId, "exercise");
  const asset = await db.replayAsset.findFirst({
    where: { id: replayId, smallGroupProgrammeId: cohort.id, status: "ready", deletedAt: null },
  });
  if (
    asset &&
    !asset.smallGroupProgrammeSessionId &&
    asset.resourceType !== "programme_demonstration"
  )
    throw new Error("FORBIDDEN");
  if (!asset?.dailyRecordingId) throw new Error("REPLAY_NOT_AVAILABLE");
  if (!staff && asset.smallGroupProgrammeSessionId) {
    const session = cohort.sessions.find((s) => s.id === asset.smallGroupProgrammeSessionId);
    const week = cohort.weeks.find((w) => w.sessionId === session?.id);
    if (
      !session?.taughtAt ||
      session.taughtAt > now ||
      !week?.published ||
      week.releasesAt > now ||
      !cohort.confirmedAt
    )
      throw new Error("NOT_RELEASED");
  }
  return getRecordingAccessLink(asset.dailyRecordingId);
}
