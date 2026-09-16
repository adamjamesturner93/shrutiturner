import { Suspense } from "react";
import { EventClearanceReview } from "@/views/programmes/event-clearance";
async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<p>Loading health reviews…</p>}>
      <EventClearanceReview id={id} />
    </Suspense>
  );
}

export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Content {...props} />
    </Suspense>
  );
}
