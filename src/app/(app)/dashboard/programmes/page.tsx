import { Suspense } from "react";
import { ClientHub } from "@/views/programmes/client-hub";
export default function Page() {
  return (
    <Suspense fallback={<p>Loading programmes…</p>}>
      <ClientHub section="programmes" />
    </Suspense>
  );
}
