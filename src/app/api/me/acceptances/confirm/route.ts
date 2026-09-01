import { AcceptanceType } from "@prisma/client";
import { apiCreated, badRequest, conflict, handleApiRoute, parseJsonBody } from "@/lib/api/route";
import {
  AcceptanceVersionChangedError,
  recordAcknowledgedAcceptances,
} from "@/lib/legal/acceptance-service";

const PAID_ACCEPTANCE_TYPES = new Set<AcceptanceType>([
  AcceptanceType.terms,
  AcceptanceType.health_waiver,
  AcceptanceType.health_data,
  AcceptanceType.coaching_agreement,
]);

type AcceptanceInput = {
  type?: unknown;
  policyVersionId?: unknown;
  version?: unknown;
  acknowledged?: unknown;
};

export const POST = handleApiRoute(
  async ({ request, sessionUser }) => {
    const body = await parseJsonBody<{ surface?: unknown; acceptances?: unknown }>(request);
    if (typeof body.surface !== "string" || !body.surface.trim()) {
      throw badRequest("Acceptance surface is required.");
    }
    if (!Array.isArray(body.acceptances) || body.acceptances.length === 0) {
      throw badRequest("Choose every required agreement before continuing.");
    }

    const acceptances = body.acceptances.map((value) => {
      const item = value as AcceptanceInput;
      if (
        typeof item.type !== "string" ||
        !PAID_ACCEPTANCE_TYPES.has(item.type as AcceptanceType) ||
        typeof item.policyVersionId !== "string" ||
        typeof item.version !== "string" ||
        item.acknowledged !== true
      ) {
        throw badRequest("Every required agreement must be explicitly acknowledged.");
      }
      return {
        type: item.type as AcceptanceType,
        policyVersionId: item.policyVersionId,
        version: item.version,
        acknowledged: true as const,
      };
    });

    try {
      const events = await recordAcknowledgedAcceptances({
        userId: sessionUser!.id,
        surface: body.surface.trim(),
        acceptances,
      });
      return apiCreated({
        events: events.map((event) => ({
          id: event.id,
          type: event.type,
          version: event.version,
          acceptedAt: event.acceptedAt.toISOString(),
        })),
      });
    } catch (error) {
      if (error instanceof AcceptanceVersionChangedError) {
        throw conflict(
          "An agreement changed while you were reviewing it. Refresh and review again."
        );
      }
      throw error;
    }
  },
  { auth: "user" }
);
