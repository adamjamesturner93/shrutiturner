import { IncidentCategory, Prisma } from "@prisma/client";
import { canManageSession } from "@/lib/authz/access";
import { db } from "@/lib/db";

const VALID_SEVERITIES = new Set(["low", "medium", "high", "critical"]);

export async function listSessionIncidents(sessionId: string, actorUserId: string) {
  const allowed = await canManageSession(actorUserId, sessionId);
  if (!allowed) {
    throw new Error("FORBIDDEN");
  }

  return db.incidentLog.findMany({
    where: { sessionId },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      category: true,
      severity: true,
      notes: true,
      followUpNotes: true,
      metadataJson: true,
      createdAt: true,
      updatedAt: true,
      affectedUserId: true,
      actorUserId: true,
    },
  });
}

export async function createSessionIncident(input: {
  sessionId: string;
  actorUserId: string;
  category: IncidentCategory;
  severity?: string;
  notes: string;
  followUpNotes?: string | null;
  affectedUserId?: string | null;
  metadataJson?: Record<string, unknown> | null;
}) {
  const allowed = await canManageSession(input.actorUserId, input.sessionId);
  if (!allowed) {
    throw new Error("FORBIDDEN");
  }

  const session = await db.classSession.findUnique({
    where: { id: input.sessionId },
    select: { id: true },
  });
  if (!session) {
    throw new Error("SESSION_NOT_FOUND");
  }

  const severity = VALID_SEVERITIES.has(input.severity || "") ? input.severity : "medium";
  const notes = input.notes.trim();
  if (!notes) {
    throw new Error("INVALID_INCIDENT_NOTES");
  }

  return db.incidentLog.create({
    data: {
      sessionId: input.sessionId,
      actorUserId: input.actorUserId,
      affectedUserId: input.affectedUserId || null,
      category: input.category,
      severity,
      notes,
      followUpNotes: input.followUpNotes?.trim() || null,
      metadataJson: input.metadataJson ? (input.metadataJson as Prisma.InputJsonValue) : undefined,
    },
    select: {
      id: true,
      category: true,
      severity: true,
      notes: true,
      followUpNotes: true,
      metadataJson: true,
      createdAt: true,
      updatedAt: true,
      affectedUserId: true,
      actorUserId: true,
    },
  });
}
