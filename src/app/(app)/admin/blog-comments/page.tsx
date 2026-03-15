import { auth } from "@/lib/auth";
import { listAdminBlogComments } from "@/lib/blog/engagement-service";
import { AdminBlogComments } from "@/views/admin/blog-comments";

export default async function Page() {
  const session = await auth();
  const initialData =
    session?.user?.role === "admin" ? await listAdminBlogComments({ status: "all" }) : null;
  return <AdminBlogComments initialData={initialData} />;
}
