import { auth } from "@/lib/auth";
import { getHealthProfile } from "@/lib/health/health-service";
import { HealthProfilePage } from "@/views/dashboard/health-profile";

export default async function Page() {
  const session = await auth();
  const initialProfile = session?.user?.id ? await getHealthProfile(session.user.id) : undefined;

  return <HealthProfilePage initialProfile={initialProfile} />;
}
