import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { isOwnerAdminRole } from "@/lib/authz/roles";
import { listAdminBlogComments } from "@/lib/blog/engagement-service";
import { AdminBlogComments } from "@/views/admin/blog-comments";
import AdminLoading from "../loading";

export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminBlogCommentsContent />
    </Suspense>
  );
}

async function AdminBlogCommentsContent() {
  const session = await auth();
  const initialData = isOwnerAdminRole(session?.user?.role)
    ? await listAdminBlogComments({ status: "all" })
    : null;
  return <AdminBlogComments initialData={initialData} />;
}
