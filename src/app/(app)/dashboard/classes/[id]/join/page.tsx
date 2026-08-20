import { Suspense } from "react";
import { DashboardClassJoin } from "@/views/dashboard/class-join";
import { getClassDefinitionBySlug } from "@/lib/content";
import DashboardClassJoinLoading from "./loading";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<DashboardClassJoinLoading />}>
      <DashboardClassJoinContent params={params} />
    </Suspense>
  );
}

async function DashboardClassJoinContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const classDetail = await getClassDefinitionBySlug(id);
  return <DashboardClassJoin classDetail={classDetail} />;
}
