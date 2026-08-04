import { connection } from "next/server";
import { apiOk, handleApiRoute } from "@/lib/api/route";
import { getMyRetreatGiftPurchases } from "@/lib/gifts/service";

export const GET = handleApiRoute(
  async ({ sessionUser }) => {
    await connection();
    return apiOk(await getMyRetreatGiftPurchases(sessionUser!.id));
  },
  { auth: "user" }
);
