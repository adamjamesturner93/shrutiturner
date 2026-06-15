import { connection } from "next/server";
import {
  apiOk,
  badRequest,
  conflict,
  handleApiRoute,
  parseJsonBody,
  notFound,
} from "@/lib/api/route";
import {
  confirmHealthProfile,
  getHealthProfile,
  upsertHealthProfile,
} from "@/lib/health/health-service";
import { isAcceptanceRequiredError } from "@/lib/legal/acceptance-service";

export const GET = handleApiRoute(
  async ({ sessionUser }) => {
    await connection();
    const profile = await getHealthProfile(sessionUser!.id);
    return apiOk(profile);
  },
  { auth: "user" }
);

export const PUT = handleApiRoute(
  async ({ request, sessionUser }) => {
    try {
      const body = await parseJsonBody<Record<string, unknown>>(request);

      const profile = await upsertHealthProfile(
        sessionUser!.id,
        {
          declarationStatus:
            body.declarationStatus === "incomplete" ||
            body.declarationStatus === "none_declared" ||
            body.declarationStatus === "context_declared"
              ? body.declarationStatus
              : undefined,
          conditions:
            body.conditions && typeof body.conditions === "object"
              ? (body.conditions as Record<string, boolean>)
              : undefined,
          details:
            body.details && typeof body.details === "object"
              ? (body.details as Record<string, string>)
              : undefined,
          tracksFlareCheckIns:
            typeof body.tracksFlareCheckIns === "boolean" ? body.tracksFlareCheckIns : undefined,
          additionalNotes:
            typeof body.additionalNotes === "string" ? body.additionalNotes : undefined,
        },
        sessionUser!.id
      );

      return apiOk(profile);
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_HEALTH_PROFILE") {
        throw badRequest("Choose a declaration option or add relevant health context.");
      }
      if (isAcceptanceRequiredError(error)) {
        throw conflict(
          "Current legal acceptance is required before saving health data.",
          error.details
        );
      }
      throw error;
    }
  },
  { auth: "user" }
);

export const POST = handleApiRoute(
  async ({ sessionUser }) => {
    try {
      const profile = await confirmHealthProfile(sessionUser!.id, sessionUser!.id);
      return apiOk(profile);
    } catch (error) {
      if (error instanceof Error && error.message === "HEALTH_PROFILE_NOT_FOUND") {
        throw notFound("Health profile not found.");
      }
      if (isAcceptanceRequiredError(error)) {
        throw conflict(
          "Current legal acceptance is required before confirming health data.",
          error.details
        );
      }
      throw error;
    }
  },
  { auth: "user" }
);
