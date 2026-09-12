import { connection } from "next/server";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getHealthProfile } from "@/lib/health/health-service";
import { getOwnRetreatRegistration } from "@/lib/retreats/registration-service";
import { RetreatRegistration } from "@/views/dashboard/retreat-registration";

export default async function Page({ params }: { params: Promise<{ attendeeId: string }> }) {
  await connection();
  const { attendeeId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    redirect(
      `/login?redirect=${encodeURIComponent(`/dashboard/retreats/registration/${attendeeId}`)}`
    );
  const data = await getOwnRetreatRegistration(session.user.id, attendeeId).catch((error) => {
    if (error instanceof Error && error.message === "NOT_FOUND") return null;
    throw error;
  });
  if (!data) notFound();
  return (
    <RetreatRegistration
      initialData={data}
      healthProfile={await getHealthProfile(session.user.id)}
    />
  );
}
