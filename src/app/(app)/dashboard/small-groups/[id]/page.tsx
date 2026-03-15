import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { getMySmallGroupProgrammeDetail } from "@/lib/small-groups/service";
import { DashboardSmallGroupDetail } from "@/views/dashboard/program-detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const session = await auth();
  const { id } = await params;
  const initialData = session?.user?.id
    ? await getMySmallGroupProgrammeDetail(session.user.id, id)
    : null;
  return <DashboardSmallGroupDetail initialData={initialData} />;
}
