import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { listMySmallGroupProgrammes } from "@/lib/small-groups/service";
import { DashboardSmallGroupsPage } from "@/views/dashboard/programs";

export default async function Page() {
  await connection();
  const session = await auth();
  const initialData = session?.user?.id ? await listMySmallGroupProgrammes(session.user.id) : [];
  return <DashboardSmallGroupsPage initialData={initialData} />;
}
