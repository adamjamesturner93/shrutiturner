import { auth } from "@/lib/auth";
import { getMyRetreatBookings } from "@/lib/retreats/service";
import { DashboardRetreats } from "@/views/dashboard/retreats-list";

export default async function Page() {
  const session = await auth();
  const initialData = session?.user?.id ? await getMyRetreatBookings(session.user.id) : null;
  return <DashboardRetreats initialData={initialData} />;
}
