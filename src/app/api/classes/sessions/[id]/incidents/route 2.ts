import { IncidentCategory } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { createSessionIncident, listSessionIncidents } from "@/lib/incidents/service";

function isIncidentCategory(value: unknown): value is IncidentCategory {
  return Object.values(IncidentCategory).includes(value as IncidentCategory);
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    const incidents = await listSessionIncidents(id, user.id);

    return NextResponse.json(
      incidents.map((incident) => ({
        ...incident,
        createdAt: incident.createdAt.toISOString(),
        updatedAt: incident.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/classes/sessions/[id]/incidents failed", error);
    return NextResponse.json({ message: "Failed to load incidents" }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      category?: unknown;
      severity?: unknown;
      notes?: unknown;
      followUpNotes?: unknown;
      affectedUserId?: unknown;
      metadataJson?: unknown;
    };

    if (!isIncidentCategory(body.category)) {
      return NextResponse.json({ message: "Invalid incident category." }, { status: 400 });
    }

    const incident = await createSessionIncident({
      sessionId: id,
      actorUserId: user.id,
      category: body.category,
      severity: typeof body.severity === "string" ? body.severity : undefined,
      notes: typeof body.notes === "string" ? body.notes : "",
      followUpNotes: typeof body.followUpNotes === "string" ? body.followUpNotes : null,
      affectedUserId: typeof body.affectedUserId === "string" ? body.affectedUserId : null,
      metadataJson:
        body.metadataJson && typeof body.metadataJson === "object"
          ? (body.metadataJson as Record<string, unknown>)
          : null,
    });

    return NextResponse.json(
      {
        ...incident,
        createdAt: incident.createdAt.toISOString(),
        updatedAt: incident.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "SESSION_NOT_FOUND") {
      return NextResponse.json({ message: "Session not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "INVALID_INCIDENT_NOTES") {
      return NextResponse.json({ message: "Incident notes are required." }, { status: 400 });
    }
    console.error("POST /api/classes/sessions/[id]/incidents failed", error);
    return NextResponse.json({ message: "Failed to create incident" }, { status: 500 });
  }
}
