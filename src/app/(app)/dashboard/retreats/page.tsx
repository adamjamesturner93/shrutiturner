import { connection } from "next/server";
import { DashboardRetreats } from "@/views/dashboard/retreats-list";
import { getMyRetreatBookings } from "@/lib/retreats/service";
import { auth } from "@/lib/auth";

export default async function Page() {
  await connection();
  const session = await auth();
  const initialData = session?.user?.id ? await getMyRetreatBookings(session.user.id) : [];
  return <DashboardRetreats initialData={initialData} />;
}
