import { DashboardLobby } from "@/views/dashboard/lobby";
import { auth } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/dashboard/dashboard-service";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await auth();
  const initialData = session?.user?.id ? await getDashboardSummary(session.user.id) : null;
  return <DashboardLobby initialData={initialData} />;
}
