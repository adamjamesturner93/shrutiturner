import { ProgrammeCreate } from "@/views/programmes/create";
import { Suspense } from "react";
import Link from "next/link";
import { requireSessionUser } from "@/lib/api/auth-user";
import { listAdminCohorts } from "@/lib/programmes/admin-service";
import { AdminLayout } from "@/components/admin-layout";
async function Content() {
  const user = await requireSessionUser();
  const cohorts = await listAdminCohorts(user.id);
  return (
    <AdminLayout title="Programmes">
      <section className="space-y-6 p-8">
        <h1 className="text-3xl">Programmes</h1>
        <ProgrammeCreate cohorts={cohorts.map((c) => ({ id: c.id, title: c.title }))} />
        {cohorts.map((c) => (
          <article className="rounded border p-5" key={c.id}>
            <h2>
              <Link className="underline" href={`/admin/programmes/${c.id}`}>
                {c.title}
              </Link>
            </h2>
            <p>{c.cohortState}</p>
          </article>
        ))}
      </section>
    </AdminLayout>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<p>Loading programmes…</p>}>
      <Content />
    </Suspense>
  );
}
