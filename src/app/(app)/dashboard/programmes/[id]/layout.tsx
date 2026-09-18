import { Suspense, type ReactNode } from "react";
import { ProgrammePortal } from "@/views/programmes/portal";
import { ProgrammePageLoading } from "@/views/programmes/loading";
async function Content({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: ReactNode;
}) {
  const { id } = await params;
  return (
    <>
      <ProgrammePortal id={id} />
      {children}
    </>
  );
}
export default function Layout(props: { params: Promise<{ id: string }>; children: ReactNode }) {
  return (
    <Suspense fallback={<ProgrammePageLoading />}>
      <Content {...props} />
    </Suspense>
  );
}
