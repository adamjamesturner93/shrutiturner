import { auth } from "@/lib/auth";
import { getAdminRetreatDetail } from "@/lib/retreats/service";
import { AdminRetreatDetail } from "@/views/admin/retreat-detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  let initialData = null;
  if (session?.user?.role === "admin") {
    try {
      initialData = await getAdminRetreatDetail(id);
    } catch {
      initialData = null;
    }
  }
  return <AdminRetreatDetail initialData={initialData} />;
}
