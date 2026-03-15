import { auth } from "@/lib/auth";
import { getMyRetreatBookingDetail } from "@/lib/retreats/service";
import { DashboardRetreatDetail } from "@/views/dashboard/retreats-portal";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  let initialData = null;
  if (session?.user?.id) {
    try {
      initialData = await getMyRetreatBookingDetail(session.user.id, id);
    } catch {
      initialData = null;
    }
  }
  return <DashboardRetreatDetail initialData={initialData} />;
}
