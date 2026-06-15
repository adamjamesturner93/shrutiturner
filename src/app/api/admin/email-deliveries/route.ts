import { apiOk, handleApiRoute } from "@/lib/api/route";
import { getAdminEmailDeliveryHealth } from "@/lib/admin/email-delivery-service";

export const GET = handleApiRoute(
  async () => {
    return apiOk(await getAdminEmailDeliveryHealth());
  },
  { auth: "owner_admin" }
);
