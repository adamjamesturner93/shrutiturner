import { Suspense } from "react";
import { ProgrammePortal } from "@/views/programmes/portal";
async function Content({ params }: { params: Promise<{ id: string; path?: string[] }> }) {
  const { id, path } = await params;
  return <ProgrammePortal id={id} path={path} />;
}
export default function Page(props: { params: Promise<{ id: string; path?: string[] }> }) {
  return (
    <Suspense fallback={<p>Loading programme…</p>}>
      <Content {...props} />
    </Suspense>
  );
}
