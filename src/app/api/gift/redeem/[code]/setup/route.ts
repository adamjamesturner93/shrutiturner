import { connection } from "next/server";
import { apiOk, handleApiRoute, notFound } from "@/lib/api/route";
import { getGiftRecipientWorkshopSetupState } from "@/lib/gifts/service";

export const GET = handleApiRoute(
  async ({ sessionUser }, routeContext?: { params: Promise<{ code: string }> }) => {
    await connection();
    const { code } = await routeContext!.params;
    try {
      return apiOk(await getGiftRecipientWorkshopSetupState(code, sessionUser!.id));
    } catch (error) {
      if (
        error instanceof Error &&
        ["NOT_FOUND", "RECIPIENT_EMAIL_MISMATCH"].includes(error.message)
      ) {
        throw notFound("Workshop gift not found.");
      }
      throw error;
    }
  },
  { auth: "user" }
);
