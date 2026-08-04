import { connection } from "next/server";
import { apiOk, handleApiRoute, notFound } from "@/lib/api/route";
import { getMyRetreatBookingDetail, updateMyRetreatSecondaryGuest } from "@/lib/retreats/service";

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

export const PATCH = handleApiRoute(
  async ({ request, sessionUser }, routeContext?: { params: Promise<{ id: string }> }) => {
    await connection();
    const { id } = await routeContext!.params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    try {
      return apiOk(
        await updateMyRetreatSecondaryGuest({
          userId: sessionUser!.id,
          bookingId: id,
          firstName: typeof body?.firstName === "string" ? body.firstName : "",
          lastName: typeof body?.lastName === "string" ? body.lastName : "",
          email: typeof body?.email === "string" ? body.email : "",
          dietaryRequirements:
            typeof body?.dietaryRequirements === "string" ? body.dietaryRequirements : "",
        })
      );
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        throw notFound("Retreat booking not found.");
      }
      if (error instanceof Error && error.message === "INVALID_SECONDARY_GUEST") {
        return Response.json(
          { success: false, error: { message: "Complete the second guest's name and email." } },
          { status: 400 }
        );
      }
      if (
        error instanceof Error &&
        ["SECONDARY_GUEST_LOCKED", "SECONDARY_GUEST_ALREADY_CLAIMED"].includes(error.message)
      ) {
        return Response.json(
          {
            success: false,
            error: { message: "These guest details can no longer be changed online." },
          },
          { status: 409 }
        );
      }
      throw error;
    }
  },
  { auth: "user" }
);
