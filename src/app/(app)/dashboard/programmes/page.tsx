import { ProgrammePageLoading } from "@/views/programmes/loading";
import { Suspense } from "react";
import { ClientHub } from "@/views/programmes/client-hub";
export default function Page() {
  return (
    <Suspense fallback={<ProgrammePageLoading />}>
      <ClientHub section="programmes" />
    </Suspense>
  );
}
