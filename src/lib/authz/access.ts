import "server-only";

import { db } from "@/lib/db";
import { isOwnerAdminRole, isStaffAdminRole } from "@/lib/authz/roles";

export async function isAssignedInstructorForSession(userId: string, sessionId: string) {
  const session = await db.classSession.findUnique({
    where: { id: sessionId },
    select: { instructorUserId: true },
  });
  return session?.instructorUserId === userId;
}

export async function canManageSession(userId: string, sessionId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });

  if (!user) return false;
  if (isStaffAdminRole(user.role)) return true;

  return isAssignedInstructorForSession(userId, sessionId);
}

export async function isAssignedInstructorForRetreatDate(userId: string, retreatDateId: string) {
  const assignment = await db.retreatDateInstructorAssignment.findUnique({
    where: {
      retreatDateId_userId: {
        retreatDateId,
        userId,
      },
    },
    select: { id: true },
  });
  return Boolean(assignment);
}

export async function isAssignedInstructorForProgrammeRun(userId: string, programmeId: string) {
  const [assignment, overriddenSession] = await Promise.all([
    db.smallGroupProgrammeInstructorAssignment.findUnique({
      where: {
        programmeId_userId: {
          programmeId,
          userId,
        },
      },
      select: { id: true },
    }),
    db.smallGroupProgrammeSession.findFirst({
      where: {
        programmeId,
        instructorUserId: userId,
      },
      select: { id: true },
    }),
  ]);
  return Boolean(assignment || overriddenSession);
}

export async function isAssignedInstructorForProgrammeSession(
  userId: string,
  programmeSessionId: string
) {
  const session = await db.smallGroupProgrammeSession.findUnique({
    where: { id: programmeSessionId },
    select: {
      instructorUserId: true,
      programmeId: true,
    },
  });
  if (!session) return false;
  if (session.instructorUserId === userId) return true;
  return isAssignedInstructorForProgrammeRun(userId, session.programmeId);
}

export async function canManageRetreatDate(userId: string, retreatDateId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return false;
  if (isStaffAdminRole(user.role)) return true;
  return isAssignedInstructorForRetreatDate(userId, retreatDateId);
}

export async function canManageProgrammeRun(userId: string, programmeId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return false;
  if (isStaffAdminRole(user.role)) return true;
  return isAssignedInstructorForProgrammeRun(userId, programmeId);
}

export async function canModerateLiveSession(userId: string, sessionId: string) {
  return canManageSession(userId, sessionId);
}

export async function canViewReplayAsset(userId: string, replayAssetId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return false;
  if (isOwnerAdminRole(user.role)) return true;

  const entitlement = await db.replayEntitlement.findFirst({
    where: {
      replayAssetId,
      userId,
      revokedAt: null,
    },
    select: { id: true },
  });
  if (entitlement) return true;

  const asset = await db.replayAsset.findUnique({
    where: { id: replayAssetId },
    select: {
      classSessionId: true,
      retreatDateId: true,
      smallGroupProgrammeId: true,
      smallGroupProgrammeSessionId: true,
    },
  });
  if (!asset) return false;
  if (asset.classSessionId) return isAssignedInstructorForSession(userId, asset.classSessionId);
  if (asset.retreatDateId) return isAssignedInstructorForRetreatDate(userId, asset.retreatDateId);
  if (asset.smallGroupProgrammeSessionId) {
    return isAssignedInstructorForProgrammeSession(userId, asset.smallGroupProgrammeSessionId);
  }
  if (asset.smallGroupProgrammeId) {
    return isAssignedInstructorForProgrammeRun(userId, asset.smallGroupProgrammeId);
  }
  return false;
}

export async function requireOwnerAdminOrAssignedInstructor(userId: string, sessionId: string) {
  const allowed = await canManageSession(userId, sessionId);
  if (!allowed) {
    throw new Error("FORBIDDEN");
  }
}

export async function getSessionAccessScope(userId: string | undefined, sessionId: string) {
  if (!userId) {
    return "public" as const;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return "public" as const;
  }

  if (isOwnerAdminRole(user.role)) {
    return "owner_admin" as const;
  }

  if (await isAssignedInstructorForSession(userId, sessionId)) {
    return "assigned_instructor" as const;
  }

  return "member" as const;
}
