import { connection } from "next/server";
import { Suspense } from "react";
import { DashboardRetreats } from "@/views/dashboard/retreats-list";
import { getMyRetreatBookings } from "@/lib/retreats/service";
import { getMyRetreatRegistrations } from "@/lib/retreats/registration-service";
import { getMyRetreatGiftPurchases } from "@/lib/gifts/service";
import { auth } from "@/lib/auth";
import DashboardRetreatsLoading from "./loading";

export default function Page() {
  return (
    <Suspense fallback={<DashboardRetreatsLoading />}>
      <DashboardRetreatsContent />
    </Suspense>
  );
}

async function DashboardRetreatsContent() {
  await connection();
  const session = await auth();
  const [initialData, initialGifts] = session?.user?.id
    ? await Promise.all([
        getMyRetreatBookings(session.user.id).catch(() => null),
        getMyRetreatGiftPurchases(session.user.id).catch(() => null),
      ])
    : [[], []];
  const registrations = session?.user?.id ? await getMyRetreatRegistrations(session.user.id).catch(() => null) : [];
  return (
    <DashboardRetreats
      initialData={initialData}
      initialGifts={initialGifts}
      registrations={registrations || []}
      registrationLoadFailed={registrations === null}
    />
  );
}
