import { connection } from "next/server";
import { handleApiRoute, notFound } from "@/lib/api/route";
import { getAdminRetreatDetail } from "@/lib/retreats/service";
import { resendRetreatLiveAccessEmail } from "@/lib/retreats/live-jobs";

export const POST = handleApiRoute(
  async (_context, routeContext?: { params: Promise<{ id: string; bookingId: string }> }) => {
    await connection();
    const { id, bookingId } = await routeContext!.params;
    try {
      await resendRetreatLiveAccessEmail(bookingId, id);
      return Response.json(await getAdminRetreatDetail(id));
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND")
        throw notFound("Booking not found.");
      throw error;
    }
  },
  { auth: "staff_admin" }
);
