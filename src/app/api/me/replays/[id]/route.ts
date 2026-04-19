import { apiOk, conflict, forbidden, gone, handleApiRoute } from "@/lib/api/route";
import { getReplayPlaybackAccess } from "@/lib/replay/service";

export const GET = handleApiRoute(
  async ({ sessionUser }, routeContext?: { params: Promise<{ id: string }> }) => {
    const { id } = await routeContext!.params;
    try {
      const replay = await getReplayPlaybackAccess(id, sessionUser!.id);
      return apiOk(replay);
    } catch (error) {
      if (error instanceof Error && error.message === "FORBIDDEN") {
        throw forbidden("Forbidden");
      }
      if (error instanceof Error && error.message === "REPLAY_EXPIRED") {
        throw gone("Replay access has expired.");
      }
      if (error instanceof Error && error.message === "REPLAY_NOT_READY") {
        throw conflict("Replay is still processing.");
      }
      throw error;
    }
  },
  { auth: "user" }
);
