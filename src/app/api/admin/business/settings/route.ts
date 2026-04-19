import { revalidatePath } from "next/cache";
import { getPlatformSettings, updatePlatformSettings } from "@/lib/admin/platform-settings-service";
import { apiOk, badRequest, handleApiRoute, parseJsonBody } from "@/lib/api/route";

type UpdateSettingsBody = {
  businessName?: string;
  supportEmail?: string | null;
  contactEmail?: string | null;
  instagramUrl?: string | null;
  defaultSeoTitle?: string | null;
  defaultSeoDescription?: string | null;
  gaMeasurementId?: string | null;
};

export const GET = handleApiRoute(
  async () => {
    const settings = await getPlatformSettings();
    return apiOk(settings);
  },
  { auth: "staff_admin" }
);

export const PATCH = handleApiRoute(
  async ({ request, requestId, requestIp, path, sessionUser }) => {
    if (!sessionUser?.id) {
      throw badRequest("Missing session user.");
    }

    const body = await parseJsonBody<UpdateSettingsBody>(request);

    try {
      const settings = await updatePlatformSettings({
        actorUserId: sessionUser.id,
        requestId,
        requestIp,
        requestPath: path,
        values: body,
      });

      revalidatePath("/");
      revalidatePath("/about");
      revalidatePath("/contact");
      revalidatePath("/privacy");

      return apiOk(settings);
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_URL") {
        throw badRequest("Instagram URL must be a valid URL.");
      }
      throw error;
    }
  },
  { auth: "staff_admin" }
);
