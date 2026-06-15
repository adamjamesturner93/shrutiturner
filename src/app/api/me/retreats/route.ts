import { connection } from "next/server";
import { apiOk, handleApiRoute } from "@/lib/api/route";
import { getMyRetreatBookings } from "@/lib/retreats/service";

export const GET = handleApiRoute(
  async ({ sessionUser }) => {
    await connection();
    const bookings = await getMyRetreatBookings(sessionUser!.id);
    return apiOk(bookings);
  },
  { auth: "user" }
);
