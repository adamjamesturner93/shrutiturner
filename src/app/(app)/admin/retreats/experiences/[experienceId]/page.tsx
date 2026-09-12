import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isStaffAdminRole } from "@/lib/authz/roles";
import { getRetreatExperience } from "@/lib/retreats/experience-service";
import { AdminRetreatExperienceEditor } from "@/views/admin/retreat-experience-editor";

export default async function Page({ params }: { params: Promise<{ experienceId: string }> }) {
  await connection();
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!isStaffAdminRole(session.user.role)) redirect("/dashboard");
  const { experienceId } = await params;
  const experience = await getRetreatExperience(experienceId);
  if (!experience) notFound();
  return <AdminRetreatExperienceEditor initialData={experience} />;
}
