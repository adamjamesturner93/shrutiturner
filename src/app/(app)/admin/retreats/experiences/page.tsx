import { connection } from "next/server";
import { listRetreatExperiences } from "@/lib/retreats/experience-service";
import { AdminRetreatExperiences } from "@/views/admin/retreat-experiences";

export default async function Page() {
  await connection();
  return <AdminRetreatExperiences experiences={await listRetreatExperiences()} />;
}
