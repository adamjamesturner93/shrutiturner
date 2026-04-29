import { apiOk, badRequest, handleApiRoute, parseJsonBody } from "@/lib/api/route";
import {
  extendMembershipDunningGrace,
  listMembershipDunningCases,
} from "@/lib/billing/dunning-service";

export const GET = handleApiRoute(
  async () => {
    const cases = await listMembershipDunningCases();
    return apiOk(
      cases.map((item) => ({
        id: item.id,
        status: item.status,
        userId: item.userId,
        memberName:
          [item.user.firstName, item.user.lastName].filter(Boolean).join(" ") || item.user.email,
        memberEmail: item.user.email,
        membershipId: item.membershipId,
        amountDuePence: item.amountDuePence,
        stripeInvoiceId: item.stripeInvoiceId,
        invoiceUrl: item.invoiceUrl,
        firstFailedAt: item.firstFailedAt.toISOString(),
        graceEndsAt: (item.graceExtendedUntil || item.graceEndsAt).toISOString(),
        suspendedAt: item.suspendedAt?.toISOString() || null,
      }))
    );
  },
  { auth: "owner_admin" }
);

export const PATCH = handleApiRoute(
  async ({ request, requestId, requestIp, path, sessionUser }) => {
    const body = await parseJsonBody<{
      dunningCaseId?: string;
      graceExtendedUntil?: string;
      reason?: string;
    }>(request);
    if (!body.dunningCaseId || !body.graceExtendedUntil || !body.reason?.trim()) {
      throw badRequest("Dunning case, extension date, and reason are required.");
    }
    const graceExtendedUntil = new Date(body.graceExtendedUntil);
    if (Number.isNaN(graceExtendedUntil.getTime())) {
      throw badRequest("Extension date must be valid.");
    }

    const updated = await extendMembershipDunningGrace({
      dunningCaseId: body.dunningCaseId,
      graceExtendedUntil,
      reason: body.reason,
      actorUserId: sessionUser!.id,
      requestId,
      requestPath: path,
      requestIp,
    });
    return apiOk(updated);
  },
  { auth: "owner_admin" }
);
