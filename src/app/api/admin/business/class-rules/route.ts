import {
  getClassOperationalSettings,
  updateClassOperationalSettings,
} from "@/lib/classes/settings-service";
import { apiOk, handleApiRoute, parseJsonBody } from "@/lib/api/route";

export const GET = handleApiRoute(
  async () => {
    const settings = await getClassOperationalSettings();
    return apiOk(settings);
  },
  { auth: "staff_admin" }
);

export const PATCH = handleApiRoute(
  async ({ request }) => {
    const body = await parseJsonBody<{
      preJoinWindowMinutes?: number;
      lateJoinCutoffMinutes?: number;
      creditRefundWindowMinutes?: number;
      emptyClassAutoCancelWindowMinutes?: number;
    }>(request);

    const settings = await updateClassOperationalSettings({
      preJoinWindowMinutes:
        typeof body.preJoinWindowMinutes === "number" ? body.preJoinWindowMinutes : undefined,
      lateJoinCutoffMinutes:
        typeof body.lateJoinCutoffMinutes === "number" ? body.lateJoinCutoffMinutes : undefined,
      creditRefundWindowMinutes:
        typeof body.creditRefundWindowMinutes === "number"
          ? body.creditRefundWindowMinutes
          : undefined,
      emptyClassAutoCancelWindowMinutes:
        typeof body.emptyClassAutoCancelWindowMinutes === "number"
          ? body.emptyClassAutoCancelWindowMinutes
          : undefined,
    });

    return apiOk(settings);
  },
  { auth: "staff_admin" }
);
