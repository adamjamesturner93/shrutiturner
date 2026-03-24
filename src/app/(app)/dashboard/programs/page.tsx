import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listMySmallGroupProgrammes } from "@/lib/small-groups/service";
import { DashboardSmallGroupsPage } from "@/views/dashboard/programs";

export default async function Page() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const initialData = await listMySmallGroupProgrammes(session.user.id);
  return <DashboardSmallGroupsPage initialData={initialData} />;
}
