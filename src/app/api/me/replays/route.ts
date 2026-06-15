import { apiOk, handleApiRoute } from "@/lib/api/route";
import { listReplayAssetsForUser } from "@/lib/replay/service";

export const GET = handleApiRoute(
  async ({ sessionUser }) => {
    const assets = await listReplayAssetsForUser(sessionUser!.id);
    return apiOk(assets);
  },
  { auth: "user" }
);
