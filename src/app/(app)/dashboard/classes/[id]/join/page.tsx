import { DashboardClassJoin } from "@/views/dashboard/class-join";
import { getClassDefinitionBySlug } from "@/lib/content";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const classDetail = await getClassDefinitionBySlug(id);
  return <DashboardClassJoin classDetail={classDetail} />;
}
