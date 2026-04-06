import { auth } from "@/lib/auth";
import { isOwnerAdminRole } from "@/lib/authz/roles";
import { listAdminBlogComments } from "@/lib/blog/engagement-service";
import { AdminBlogComments } from "@/views/admin/blog-comments";

export default async function Page() {
  const session = await auth();
  const initialData = isOwnerAdminRole(session?.user?.role)
    ? await listAdminBlogComments({ status: "all" })
    : null;
  return <AdminBlogComments initialData={initialData} />;
}
