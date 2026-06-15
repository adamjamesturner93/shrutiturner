import { connection } from "next/server";
import { apiOk, handleApiRoute } from "@/lib/api/route";
import { isOwnerAdminRole } from "@/lib/authz/roles";
import {
  ensureInstructorMembership,
  getMembershipState,
  syncMembershipFromStripe,
} from "@/lib/membership/membership-service";

export const GET = handleApiRoute(
  async ({ sessionUser }) => {
    await connection();
    const user = sessionUser!;
    if (isOwnerAdminRole(user.role)) {
      await ensureInstructorMembership(user.id);
    } else {
      await syncMembershipFromStripe(user.id).catch((error) => {
        console.warn("[membership] Stripe sync skipped; serving cached membership state instead", {
          userId: user.id,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }
    const state = await getMembershipState(user.id);
    return apiOk(state);
  },
  { auth: "user" }
);
