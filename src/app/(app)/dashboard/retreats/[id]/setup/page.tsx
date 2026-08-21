import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getHealthProfile } from "@/lib/health/health-service";
import { getWorkshopBookingSetupState } from "@/lib/retreats/workshop-setup";
import { WorkshopSetupPage } from "@/views/dashboard/workshop-setup";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      `/login?intent=online-workshop&redirect=${encodeURIComponent(`/dashboard/retreats/${id}/setup`)}`
    );
  }
  const initialData = await getWorkshopBookingSetupState(id, session.user.id).catch((error) => {
    if (error instanceof Error && error.message === "NOT_FOUND") return null;
    throw error;
  });
  if (!initialData) notFound();
  const initialHealthProfile = await getHealthProfile(session.user.id);
  return (
    <WorkshopSetupPage initialData={initialData} initialHealthProfile={initialHealthProfile} />
  );
}
