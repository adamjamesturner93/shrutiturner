import { ProgrammePageLoading } from "@/views/programmes/loading";
import { Suspense } from "react";
import { ProgrammeAdmin } from "@/views/programmes/admin";
async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProgrammeAdmin id={id} />;
}
export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<ProgrammePageLoading admin label="Loading cohort administration" />}>
      <Content {...props} />
    </Suspense>
  );
}
