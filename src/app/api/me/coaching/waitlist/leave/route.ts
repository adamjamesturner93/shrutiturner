import { apiOk, handleApiRoute, notFound } from "@/lib/api/route";
import { leaveCoachingWaitlist } from "@/lib/coaching/service";

export const POST = handleApiRoute(
  async ({ sessionUser }) => {
    try {
      const application = await leaveCoachingWaitlist(sessionUser!.id);
      return apiOk({
        id: application.id,
        status: application.status,
        waitlistLeftAt: application.waitlistLeftAt?.toISOString() || null,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "WAITLIST_ENTRY_NOT_FOUND") {
        throw notFound("No active coaching waiting-list place was found.");
      }
      throw error;
    }
  },
  { auth: "user" }
);
