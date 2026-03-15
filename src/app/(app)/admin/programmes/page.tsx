import { connection } from "next/server";
import {
  listAdminSmallGroupProgrammes,
  listSmallGroupTemplateOptions,
} from "@/lib/small-groups/service";
import { AdminProgrammes } from "@/views/admin/programmes";

export default async function Page() {
  await connection();
  const [initialData, templateOptions] = await Promise.all([
    listAdminSmallGroupProgrammes(),
    listSmallGroupTemplateOptions(),
  ]);
  return <AdminProgrammes initialData={initialData} templateOptions={templateOptions} />;
}
