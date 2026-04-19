import { requestEmailChange } from "@/lib/account/account-service";
import { apiOk, badRequest, handleApiRoute, parseJsonBody, tooManyRequests } from "@/lib/api/route";

type Body = {
  nextEmail?: string;
};

export const POST = handleApiRoute(
  async ({ request, requestIp, sessionUser }) => {
    const body = await parseJsonBody<Body>(request);

    try {
      const result = await requestEmailChange(
        sessionUser?.id || "",
        body.nextEmail || "",
        requestIp
      );
      return apiOk(result);
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (error.message === "INVALID_EMAIL") throw badRequest("Enter a valid new email address.");
      if (error.message === "EMAIL_UNCHANGED") {
        throw badRequest("Your new email must be different from the current email.");
      }
      if (error.message === "EMAIL_IN_USE") {
        throw badRequest("That email address is already in use.");
      }
      if (error.message === "EMAIL_CHANGE_COOLDOWN") {
        throw tooManyRequests("Please wait before requesting another email change code.");
      }
      throw error;
    }
  },
  { auth: "user" }
);
