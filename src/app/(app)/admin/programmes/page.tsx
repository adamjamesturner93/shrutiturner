import { StatusPill, ActionLink, eyebrow, cardSurface } from "@/views/programmes/visuals";
import { programmeStateLabels } from "@/lib/programmes/presentation";
import { ProgrammeCreate } from "@/views/programmes/create";
import { Suspense } from "react";
import { requireSessionUser } from "@/lib/api/auth-user";
import { listAdminCohorts } from "@/lib/programmes/admin-service";
import { AdminLayout } from "@/components/admin-layout";
async function Content() {
  const user = await requireSessionUser();
  const cohorts = await listAdminCohorts(user.id);
  return (
    <AdminLayout title="Programmes">
      <section className="space-y-6 p-8">
        <header className="space-y-3">
          <p className={eyebrow}>Coaching together</p>
          <h1 className="text-3xl md:text-4xl">Programmes</h1>
          <p className="text-muted-foreground">
            Set up a cohort, support your participants and manage each week in one place.
          </p>
        </header>
        <ProgrammeCreate cohorts={cohorts.map((c) => ({ id: c.id, title: c.title }))} />
        <div className="grid gap-5 md:grid-cols-2">
          {cohorts.map((c) => (
            <article className={`${cardSurface} space-y-5 p-6`} key={c.id}>
              <StatusPill>
                {programmeStateLabels[c.cohortState || "draft"] || c.cohortState}
              </StatusPill>
              <h2 className="text-2xl">{c.title}</h2>
              <ActionLink href={`/admin/programmes/${c.id}`}>Manage cohort</ActionLink>
            </article>
          ))}
        </div>
        {!cohorts.length && <p>Create your first draft cohort to get started.</p>}
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
