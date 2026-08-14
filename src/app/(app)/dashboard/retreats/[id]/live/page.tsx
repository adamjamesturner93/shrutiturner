import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRetreatLiveLandingState } from "@/lib/retreats/live-service";
import { DashboardRetreatLive } from "@/views/dashboard/retreat-live";

// test

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const { id: bookingId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    const incoming = await searchParams;
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(incoming)) {
      if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
      else if (value) query.set(key, value);
    }
    const suffix = query.toString();
    const destination = `/dashboard/retreats/${bookingId}/live${suffix ? `?${suffix}` : ""}`;
    redirect(`/login?redirect=${encodeURIComponent(destination)}`);
  }
  const data = await getRetreatLiveLandingState(bookingId, session.user.id).catch((error) => {
    if (error instanceof Error && ["NOT_FOUND", "FORBIDDEN"].includes(error.message)) return null;
    throw error;
  });
  if (!data) notFound();
  return <DashboardRetreatLive initialData={data} />;
}
