import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminRetreatDetail } from "@/views/admin/retreat-detail";
import { getAdminRetreatDetail } from "@/lib/retreats/service";
import AdminRetreatDetailLoading from "./loading";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<AdminRetreatDetailLoading />}>
      <AdminRetreatContent params={params} />
    </Suspense>
  );
}

async function AdminRetreatContent({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const initialData = await getAdminRetreatDetail(id).catch((error) => {
    if (error instanceof Error && error.message === "NOT_FOUND") return null;
    throw error;
  });
  if (!initialData) notFound();
  return <AdminRetreatDetail initialData={initialData} />;
}
