import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadCohort, requireCohortStaff } from "@/lib/programmes/access";
import { getPublicProgrammes } from "@/lib/programmes/public-service";
import { representative } from "@/lib/programmes/presentation";
import { programmeNow } from "@/lib/programmes/clock";
import { PublicProgrammeSales } from "@/views/programmes/public-sales";
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string; cohort?: string }>;
};
async function Sales({ params, searchParams }: Props) {
  await connection();
  const { slug } = await params;
  const query = await searchParams;
  const preview = query.preview === "1";
  if (preview) {
    const user = await auth();
    if (!user?.user?.id) notFound();
    const c = await loadCohort(slug).catch(() => null);
    if (!c) notFound();
    await requireCohortStaff(user.user.id, c.id).catch(() => notFound());
    const [cohort] = await getPublicProgrammes(c.id);
    if (!cohort) notFound();
    return <PublicProgrammeSales cohort={cohort} choices={[cohort]} preview />;
  }
  const all = await getPublicProgrammes();
  const programme = all.filter((c) => c.slug === slug);
  const legacy = programme.length ? undefined : all.find((c) => c.runSlug === slug);
  const choices = programme.length
    ? programme
    : legacy
      ? all.filter((c) => c.programmeId === legacy.programmeId)
      : [];
  const selected = query.cohort
    ? choices.find((c) => c.runSlug === query.cohort)
    : legacy ||
      representative(choices, programmeNow()) ||
      choices.find((c) => c.availability === "In progress");
  if (!selected) notFound();
  const future = choices.filter((c) => c.startsAt && new Date(c.startsAt) > programmeNow());
  return (
    <PublicProgrammeSales
      cohort={selected}
      choices={future.some((c) => c.id === selected.id) ? future : [selected, ...future]}
    />
  );
}
export default function Page(props: Props) {
  return (
    <Suspense fallback={<p>Loading programme…</p>}>
      <Sales {...props} />
    </Suspense>
  );
}
