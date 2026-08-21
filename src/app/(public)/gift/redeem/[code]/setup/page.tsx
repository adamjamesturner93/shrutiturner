import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getGiftRecipientWorkshopSetupState } from "@/lib/gifts/service";
import { getHealthProfile } from "@/lib/health/health-service";
import { WorkshopSetupPage } from "@/views/dashboard/workshop-setup";

export const metadata: Metadata = {
  title: "Workshop setup",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  await connection();
  const { code } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      `/login?intent=online-workshop&redirect=${encodeURIComponent(`/gift/redeem/${code}/setup`)}`
    );
  }
  const initialData = await getGiftRecipientWorkshopSetupState(code, session.user.id).catch(
    () => null
  );
  if (!initialData) notFound();
  const initialHealthProfile = await getHealthProfile(session.user.id);
  return (
    <WorkshopSetupPage
      initialData={initialData}
      initialHealthProfile={initialHealthProfile}
      refreshEndpoint={`/api/gift/redeem/${code}/setup`}
      continueHref={`/gift/redeem/${code}`}
      continueLabel="Continue to redeem gift"
    />
  );
}
