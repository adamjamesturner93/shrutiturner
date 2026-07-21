import { connection } from "next/server";
import { notFound } from "next/navigation";
import { DashboardRetreatDetail } from "@/views/dashboard/retreats-portal";
import { auth } from "@/lib/auth";
import { getMyRetreatBookingDetail } from "@/lib/retreats/service";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { id } = await params;
  const initialData = await getMyRetreatBookingDetail(session.user.id, id).catch((error) => {
    if (error instanceof Error && error.message === "NOT_FOUND") return null;
    throw error;
  });
  if (!initialData) notFound();
  return <DashboardRetreatDetail initialData={initialData} />;
}
