import { apiOk, badRequest, handleApiRoute, parseJsonBody } from "@/lib/api/route";
import { startOrSwitchMembership } from "@/lib/membership/membership-service";

export const POST = handleApiRoute(
  async ({ request, sessionUser }) => {
    const body = await parseJsonBody<{
      plan?: string;
      billingInterval?: string;
    }>(request);
    const plan = body.plan;
    const billingInterval = body.billingInterval === "annual" ? "annual" : "monthly";

    if (plan !== "movewell") {
      throw badRequest("Invalid plan.");
    }

    const membership = await startOrSwitchMembership({
      userId: sessionUser!.id,
      plan,
      billingInterval,
    });
    return apiOk({ membership });
  },
  { auth: "user" }
);
