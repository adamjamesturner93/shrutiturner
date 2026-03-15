import { connection } from "next/server";
import { getAdminSmallGroupProgrammeDetail } from "@/lib/small-groups/service";
import { AdminProgrammeDetail } from "@/views/admin/programme-detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const initialData = await getAdminSmallGroupProgrammeDetail(id);
  return <AdminProgrammeDetail initialData={initialData} />;
}
