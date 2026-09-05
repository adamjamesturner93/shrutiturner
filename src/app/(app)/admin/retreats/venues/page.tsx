import { connection } from "next/server";
import { AdminRetreatVenues } from "@/views/admin/retreat-venues";
import { getAdminRetreatVenues } from "@/lib/retreats/service";

export default async function Page() {
  await connection();
  return <AdminRetreatVenues initialData={await getAdminRetreatVenues()} />;
}
