import { AcceptanceType, Prisma } from "@prisma/client";
import { apiCreated, badRequest, handleApiRoute, parseJsonBody } from "@/lib/api/route";
import { recordAcceptanceEvent } from "@/lib/legal/acceptance-service";

const SELF_SERVICE_ACCEPTANCE_TYPES = new Set<AcceptanceType>([
  AcceptanceType.terms,
  AcceptanceType.health_waiver,
  AcceptanceType.health_data,
  AcceptanceType.coaching_agreement,
  AcceptanceType.recording_notice,
  AcceptanceType.marketing,
]);

export const POST = handleApiRoute(
  async ({ sessionUser, request }) => {
    const body = await parseJsonBody<{
      type?: string;
      surface?: string;
      metadataJson?: Record<string, unknown>;
    }>(request);

    if (
      typeof body.type !== "string" ||
      !SELF_SERVICE_ACCEPTANCE_TYPES.has(body.type as AcceptanceType)
    ) {
      throw badRequest("Invalid acceptance type.");
    }

    if (typeof body.surface !== "string" || body.surface.trim().length === 0) {
      throw badRequest("Acceptance surface is required.");
    }

    const event = await recordAcceptanceEvent({
      userId: sessionUser!.id,
      actorUserId: sessionUser!.id,
      type: body.type as AcceptanceType,
      surface: body.surface.trim(),
      metadataJson:
        body.metadataJson && typeof body.metadataJson === "object"
          ? (body.metadataJson as Prisma.InputJsonValue)
          : undefined,
    });

    return apiCreated({
      id: event.id,
      type: event.type,
      version: event.version,
      acceptedAt: event.acceptedAt.toISOString(),
    });
  },
  { auth: "user" }
);
