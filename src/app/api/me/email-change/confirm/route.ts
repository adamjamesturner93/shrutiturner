import { confirmEmailChange } from "@/lib/account/account-service";
import { apiOk, badRequest, handleApiRoute, parseJsonBody } from "@/lib/api/route";

type Body = {
  nextEmail?: string;
  code?: string;
};

export const POST = handleApiRoute(
  async ({ request, requestIp, sessionUser }) => {
    const body = await parseJsonBody<Body>(request);

    try {
      const result = await confirmEmailChange(
        sessionUser?.id || "",
        body.nextEmail || "",
        body.code || "",
        requestIp
      );
      return apiOk(result);
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (
        error.message === "INVALID_EMAIL_CHANGE_CONFIRMATION" ||
        error.message === "EMAIL_CHANGE_MISMATCH" ||
        error.message === "INVALID_EMAIL_CHANGE_CODE"
      ) {
        throw badRequest("The email change code is invalid or expired.");
      }
      throw error;
    }
  },
  { auth: "user" }
);
