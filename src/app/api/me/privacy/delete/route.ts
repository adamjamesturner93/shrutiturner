import { executePrivacyDeletion } from "@/lib/privacy/service";
import { apiOk, badRequest, handleApiRoute } from "@/lib/api/route";

export const POST = handleApiRoute(
  async ({ sessionUser }) => {
    if (!sessionUser?.id) {
      throw badRequest("Missing session user.");
    }

    try {
      const result = await executePrivacyDeletion(sessionUser.id, sessionUser.id);
      return apiOk({ requestId: result.id, deleted: true });
    } catch (error) {
      if (error instanceof Error && error.message === "PRIVACY_DELETION_BLOCKED") {
        throw badRequest("Account deletion is currently blocked due to an active legal hold.");
      }
      throw error;
    }
  },
  { auth: "user" }
);
