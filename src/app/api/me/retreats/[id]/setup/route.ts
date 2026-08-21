import { connection } from "next/server";
import { apiOk, handleApiRoute, notFound } from "@/lib/api/route";
import { getWorkshopBookingSetupState } from "@/lib/retreats/workshop-setup";

export const GET = handleApiRoute(
  async ({ sessionUser }, routeContext?: { params: Promise<{ id: string }> }) => {
    await connection();
    const { id } = await routeContext!.params;
    try {
      return apiOk(await getWorkshopBookingSetupState(id, sessionUser!.id));
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        throw notFound("Workshop booking not found.");
      }
      throw error;
    }
  },
  { auth: "user" }
);
