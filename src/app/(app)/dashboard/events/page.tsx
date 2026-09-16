import { Suspense } from "react";
import { ClientHub } from "@/views/programmes/client-hub";
export default function Page() {
  return (
    <Suspense fallback={<p>Loading events…</p>}>
      <ClientHub section="events" />
    </Suspense>
  );
}
