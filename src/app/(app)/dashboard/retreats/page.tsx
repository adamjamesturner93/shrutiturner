import { connection } from "next/server";
import { DashboardRetreats } from "@/views/dashboard/retreats-list";
import { getMyRetreatBookings } from "@/lib/retreats/service";
import { getMyRetreatGiftPurchases } from "@/lib/gifts/service";
import { auth } from "@/lib/auth";

export default async function Page() {
  await connection();
  const session = await auth();
  const [initialData, initialGifts] = session?.user?.id
    ? await Promise.all([
        getMyRetreatBookings(session.user.id),
        getMyRetreatGiftPurchases(session.user.id),
      ])
    : [[], []];
  return <DashboardRetreats initialData={initialData} initialGifts={initialGifts} />;
}
