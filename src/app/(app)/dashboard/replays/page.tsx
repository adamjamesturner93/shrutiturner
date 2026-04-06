import { auth } from "@/lib/auth";
import { listReplayAssetsForUser } from "@/lib/replay/service";
import { DashboardReplays } from "@/views/dashboard/replays";

export default async function Page() {
  const session = await auth();
  const initialData = session?.user?.id ? await listReplayAssetsForUser(session.user.id) : [];

  return <DashboardReplays initialData={initialData} />;
}
