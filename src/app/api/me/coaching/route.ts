import { connection } from "next/server";
import { apiOk, handleApiRoute } from "@/lib/api/route";
import { getMyCoachingState } from "@/lib/coaching/service";

export const GET = handleApiRoute(
  async ({ sessionUser }) => {
    await connection();
    const state = await getMyCoachingState(sessionUser!.id);
    return apiOk(state);
  },
  { auth: "user" }
);
