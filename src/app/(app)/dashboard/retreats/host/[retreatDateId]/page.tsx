import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getRetreatHostPageState } from "@/lib/retreats/live-service";
import { DashboardRetreatHostLive } from "@/views/dashboard/retreat-host-live";
import RetreatHostLoading from "./loading";

export default function Page({ params }: { params: Promise<{ retreatDateId: string }> }) {
  return (
    <Suspense fallback={<RetreatHostLoading />}>
      <RetreatHostContent params={params} />
    </Suspense>
  );
}

async function RetreatHostContent({ params }: { params: Promise<{ retreatDateId: string }> }) {
  await connection();
  const { retreatDateId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    redirect(`/login?redirect=${encodeURIComponent(`/dashboard/retreats/host/${retreatDateId}`)}`);
  const data = await getRetreatHostPageState(retreatDateId, session.user.id).catch((error) => {
    if (error instanceof Error && ["NOT_FOUND", "FORBIDDEN"].includes(error.message)) return null;
    throw error;
  });
  if (!data) notFound();
  return <DashboardRetreatHostLive initialData={data} />;
}
