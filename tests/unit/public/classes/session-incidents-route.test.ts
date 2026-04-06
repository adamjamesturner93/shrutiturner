import { beforeEach, describe, expect, it, vi } from "vitest";

const requireSessionUserMock = vi.fn();
const listSessionIncidentsMock = vi.fn();
const createSessionIncidentMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireSessionUser: requireSessionUserMock,
}));

vi.mock("@/lib/incidents/service", () => ({
  listSessionIncidents: listSessionIncidentsMock,
  createSessionIncident: createSessionIncidentMock,
}));

const route = await import("@/app/api/classes/sessions/[id]/incidents/route");

describe("session incidents route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSessionUserMock.mockResolvedValue({ id: "instructor_123" });
  });

  it("returns session-scoped incidents for an authorized actor", async () => {
    listSessionIncidentsMock.mockResolvedValue([
      {
        id: "incident_123",
        category: "unsafe_behaviour",
        severity: "high",
        notes: "Participant repeatedly ignored stop instruction.",
        followUpNotes: null,
        metadataJson: null,
        createdAt: new Date("2026-04-03T12:00:00.000Z"),
        updatedAt: new Date("2026-04-03T12:00:00.000Z"),
        affectedUserId: "member_123",
        actorUserId: "instructor_123",
      },
    ]);

    const response = await route.GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "session_123" }),
    });

    expect(response.status).toBe(200);
    expect(listSessionIncidentsMock).toHaveBeenCalledWith("session_123", "instructor_123");
  });

  it("creates a new incident for an authorized actor", async () => {
    createSessionIncidentMock.mockResolvedValue({
      id: "incident_123",
      category: "injury_concern",
      severity: "medium",
      notes: "Participant reported shoulder pain during class.",
      followUpNotes: null,
      metadataJson: null,
      createdAt: new Date("2026-04-03T12:00:00.000Z"),
      updatedAt: new Date("2026-04-03T12:00:00.000Z"),
      affectedUserId: "member_123",
      actorUserId: "instructor_123",
    });

    const response = await route.POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "injury_concern",
          severity: "medium",
          notes: "Participant reported shoulder pain during class.",
          affectedUserId: "member_123",
        }),
      }),
      {
        params: Promise.resolve({ id: "session_123" }),
      }
    );

    expect(response.status).toBe(201);
    expect(createSessionIncidentMock).toHaveBeenCalledWith({
      sessionId: "session_123",
      actorUserId: "instructor_123",
      category: "injury_concern",
      severity: "medium",
      notes: "Participant reported shoulder pain during class.",
      followUpNotes: null,
      affectedUserId: "member_123",
      metadataJson: null,
    });
  });

  it("maps permission failures to 403", async () => {
    listSessionIncidentsMock.mockRejectedValue(new Error("FORBIDDEN"));

    const response = await route.GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "session_123" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ message: "Forbidden" });
  });
});
