import { Suspense } from "react";
import { ProgrammeAdmin } from "@/views/programmes/admin";
async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProgrammeAdmin id={id} />;
}
export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Loading cohort…</p>}>
      <Content {...props} />
    </Suspense>
  );
}
