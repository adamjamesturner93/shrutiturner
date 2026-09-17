import { Suspense } from "react";
import { ClientHub } from "@/views/programmes/client-hub";
async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientHub section="events" eventId={id} />;
}
export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Loading bookings…</p>}>
      <Content {...props} />
    </Suspense>
  );
}
