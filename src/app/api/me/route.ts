import { connection } from "next/server";
import { getAccount, updateAccount } from "@/lib/account/account-service";
import { getBaseSiteUrlFromEnv } from "@/lib/env";
import { apiOk, ApiError, handleApiRoute, parseJsonBody } from "@/lib/api/route";

function siteUrlFromRequest(request: Request) {
  const configured = getBaseSiteUrlFromEnv();
  if (configured !== "http://localhost:3000") return configured;
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export const GET = handleApiRoute(
  async ({ request, sessionUser }) => {
    try {
      await connection();
      const account = await getAccount(sessionUser!.id, siteUrlFromRequest(request));
      return apiOk(account);
    } catch (error) {
      mapUpdateError(error);
    }
  },
  { auth: "user" }
);

export const PATCH = handleApiRoute(
  async ({ request, sessionUser }) => {
    try {
      const body = await parseJsonBody<Record<string, unknown>>(request);
      const updated = await updateAccount(sessionUser!.id, {
        firstName: typeof body.firstName === "string" ? body.firstName : undefined,
        lastName: typeof body.lastName === "string" ? body.lastName : undefined,
        dob: typeof body.dob === "string" ? body.dob : body.dob === null ? null : undefined,
        gender:
          typeof body.gender === "string" ? body.gender : body.gender === null ? null : undefined,
        ethnicity:
          typeof body.ethnicity === "string"
            ? body.ethnicity
            : body.ethnicity === null
              ? null
              : undefined,
        timezone: typeof body.timezone === "string" ? body.timezone : undefined,
        dateFormat: typeof body.dateFormat === "string" ? body.dateFormat : undefined,
        hasAgreedToTerms:
          typeof body.hasAgreedToTerms === "boolean" ? body.hasAgreedToTerms : undefined,
        hasAgreedToHealth:
          typeof body.hasAgreedToHealth === "boolean" ? body.hasAgreedToHealth : undefined,
        hasConsentedToHealthData:
          typeof body.hasConsentedToHealthData === "boolean"
            ? body.hasConsentedToHealthData
            : undefined,
        heardAboutSource:
          typeof body.heardAboutSource === "string"
            ? body.heardAboutSource
            : body.heardAboutSource === null
              ? null
              : undefined,
        heardAboutDetail:
          typeof body.heardAboutDetail === "string"
            ? body.heardAboutDetail
            : body.heardAboutDetail === null
              ? null
              : undefined,
        isOnboarded: typeof body.isOnboarded === "boolean" ? body.isOnboarded : undefined,
      });
      return apiOk({ profile: updated });
    } catch (error) {
      mapUpdateError(error);
    }
  },
  { auth: "user" }
);

function mapUpdateError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message === "USER_NOT_FOUND") {
      throw new ApiError(
        401,
        "SESSION_INVALID",
        "Your account session is no longer valid. Please sign in again."
      );
    }
    if (error.message === "INVALID_DOB") {
      throw new ApiError(400, "INVALID_DOB", "Date of birth is invalid.");
    }
    if (error.message === "UNDER_18") {
      throw new ApiError(400, "UNDER_18", "You must be 18 or over to use this service.");
    }
    if (error.message === "INVALID_DATE_FORMAT") {
      throw new ApiError(400, "INVALID_DATE_FORMAT", "Invalid date format.");
    }
  }

  throw error;
}
