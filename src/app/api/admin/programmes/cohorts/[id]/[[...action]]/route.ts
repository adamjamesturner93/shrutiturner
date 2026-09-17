import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/api/auth-user";
import { requireCohortStaff } from "@/lib/programmes/access";
import { programmeError } from "@/lib/programmes/http";
import { db } from "@/lib/db";
import {
  addProgrammeRecording,
  saveCohortSettings,
  savePublicPresentation,
  publishCohort,
  confirmCohort,
  saveProgrammeWeek,
  saveProgrammeSession,
  markTeachingComplete,
  redeemProgrammeCredit,
} from "@/lib/programmes/admin-service";
import { reviewProgrammeHealth } from "@/lib/programmes/clearance-service";
import { cancelProgramme, refundProgrammeEnrolment } from "@/lib/programmes/checkout-service";
import { programmeRecording } from "@/lib/programmes/live-service";
import { programmeNow } from "@/lib/programmes/clock";
type Context = { params: Promise<{ id: string; action?: string[] }> };
export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    const cohort = await requireCohortStaff(user.id, id);
    const participants = await db.smallGroupProgrammeEnrollment.findMany({
      where: { programmeId: cohort.id },
      include: {
        user: { select: { emailVerified: true, healthProfile: { include: { selections: true } } } },
      },
    });
    const clearances = await db.offeringClearance.findMany({ where: { programmeId: cohort.id } });
    return Response.json(
      {
        cohort,
        participants,
        clearances,
        confirmationDue:
          !cohort.confirmedAt &&
          Boolean(cohort.confirmationDeadline && programmeNow() >= cohort.confirmationDeadline),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return programmeError(error);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    const user = await requireSessionUser();
    const { id, action = [] } = await context.params;
    const raw: unknown = await request.json();
    const body =
      raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
    let result: unknown;
    switch (action[0]) {
      case "recordings":
        result = await addProgrammeRecording(user.id, id, raw);
        break;
      case "presentation":
        result = await savePublicPresentation(user.id, id, raw);
        break;
      case "settings":
        result = await saveCohortSettings(user.id, id, raw);
        break;
      case "publish":
        result = await publishCohort(user.id, id);
        break;
      case "confirm":
        result = await confirmCohort(user.id, id);
        break;
      case "clearance":
        result = await reviewProgrammeHealth(user.id, id, raw);
        break;
      case "weeks":
        result = await saveProgrammeWeek(user.id, id, action[1], raw);
        break;
      case "sessions":
        result = await saveProgrammeSession(user.id, id, action[1], raw);
        break;
      case "teaching":
        result = await markTeachingComplete(user.id, id, action[1]);
        break;
      case "recording":
        result = await programmeRecording(
          user.id,
          id,
          action[1],
          body.action === "stop" ? "stop" : "start"
        );
        break;
      case "cancel":
        result = await cancelProgramme(user.id, id, String(body.reason || ""));
        break;
      case "refund":
        result = await refundProgrammeEnrolment(user.id, id, action[1]);
        break;
      case "credit":
        result = await redeemProgrammeCredit(
          user.id,
          id,
          action[1],
          String(body.reference || ""),
          typeof body.service === "string" ? body.service : undefined
        );
        break;
      default:
        throw new Error("NOT_FOUND");
    }
    revalidatePath("/programmes", "layout");
    return Response.json(result ?? { ok: true });
  } catch (error) {
    return programmeError(error);
  }
}
