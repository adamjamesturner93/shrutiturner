import { apiOk, badRequest, handleApiRoute, serviceUnavailable } from "@/lib/api/route";
import { cancelMembership } from "@/lib/membership/membership-service";

type CancellationPayload = {
  reason?: unknown;
  reasonDetail?: unknown;
};

async function readCancellationPayload(request: Request) {
  let payload: CancellationPayload = {};

  try {
    const parsed = await request.json();
    payload = parsed && typeof parsed === "object" ? (parsed as CancellationPayload) : {};
  } catch {
    payload = {};
  }

  const reason = typeof payload.reason === "string" ? payload.reason.trim() : "";
  const reasonDetail = typeof payload.reasonDetail === "string" ? payload.reasonDetail.trim() : "";

  if (reason.length > 80) {
    throw badRequest("Cancellation reason must be 80 characters or fewer.");
  }

  if (reasonDetail.length > 500) {
    throw badRequest("Cancellation detail must be 500 characters or fewer.");
  }

  return {
    reason: reason || undefined,
    reasonDetail: reasonDetail || undefined,
  };
}

export const POST = handleApiRoute(
  async ({ request, sessionUser }) => {
    try {
      const cancellation = await readCancellationPayload(request);
      const membership = await cancelMembership(sessionUser!.id, cancellation);
      return apiOk({ membership });
    } catch (error) {
      if (error instanceof Error && error.message === "STRIPE_NOT_CONFIGURED") {
        throw serviceUnavailable("Stripe is not configured.");
      }
      throw error;
    }
  },
  { auth: "user" }
);
