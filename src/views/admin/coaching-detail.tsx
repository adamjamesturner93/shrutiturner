import { AdminCoaching } from "@/views/admin/coaching";
import type { AdminCoachingApplicationDto } from "@/lib/api/types";

export function AdminCoachingDetail({ application }: { application: AdminCoachingApplicationDto }) {
  return <AdminCoaching initialData={[application]} focusApplicationId={application.id} />;
}
