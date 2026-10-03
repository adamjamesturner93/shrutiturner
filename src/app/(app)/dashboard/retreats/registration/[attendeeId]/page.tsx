import { RetreatRegistrationAccess } from "@/views/dashboard/retreat-registration-access";
import { Suspense } from "react";
import RegistrationLoading from "./loading";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getHealthProfile } from "@/lib/health/health-service";
import { getOwnRetreatRegistration } from "@/lib/retreats/registration-service";
import { RetreatRegistration } from "@/views/dashboard/retreat-registration";

type RegistrationPageProps = { params: Promise<{ attendeeId: string }> };

export default function Page({ params }: RegistrationPageProps) {
  return (
    <Suspense fallback={<RegistrationLoading />}>
      <RegistrationContent params={params} />
    </Suspense>
  );
}

async function RegistrationContent({ params }: RegistrationPageProps) {
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
  if (!data) return <RetreatRegistrationAccess attendeeId={attendeeId} />;
  return (
    <RetreatRegistration
      initialData={data}
      healthProfile={await getHealthProfile(session.user.id)}
    />
  );
}
