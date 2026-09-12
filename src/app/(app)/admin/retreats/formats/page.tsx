import { connection } from "next/server";
import { listRetreatFormats } from "@/lib/retreats/format-service";
import { AdminRetreatFormats } from "@/views/admin/retreat-formats";

export default async function Page() {
  await connection();
  return <AdminRetreatFormats initialData={await listRetreatFormats({ includeArchived: true })} />;
}
