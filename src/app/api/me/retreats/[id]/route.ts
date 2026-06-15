import { connection } from "next/server";
import { apiOk, handleApiRoute, notFound } from "@/lib/api/route";
import { getMyRetreatBookingDetail } from "@/lib/retreats/service";

export const GET = handleApiRoute(
  async ({ sessionUser }, routeContext?: { params: Promise<{ id: string }> }) => {
    await connection();
    const { id } = await routeContext!.params;
    try {
      const booking = await getMyRetreatBookingDetail(sessionUser!.id, id);
      return apiOk(booking);
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        throw notFound("Retreat booking not found.");
      }
      throw error;
    }
  },
  { auth: "user" }
);
