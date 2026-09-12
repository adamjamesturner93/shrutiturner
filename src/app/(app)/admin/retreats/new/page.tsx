import { connection } from "next/server";
import { AdminRetreatCreate } from "@/views/admin/retreat-create";
import { listRetreatExperiences } from "@/lib/retreats/experience-service";
import { listRetreatFormats } from "@/lib/retreats/format-service";
import { getAdminRetreatVenues } from "@/lib/retreats/service";

export default async function Page() {
  await connection();
  const [formats, experiences, venues] = await Promise.all([
    listRetreatFormats(),
    listRetreatExperiences(),
    getAdminRetreatVenues(),
  ]);
  return <AdminRetreatCreate formats={formats} experiences={experiences} venues={venues} />;
}
