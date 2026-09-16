import { Suspense } from "react";
import { ClientHub } from "@/views/programmes/client-hub";
import { DashboardLobby } from "@/views/dashboard/lobby";

async function DashboardContent({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const query = await searchParams;
  return query.onboarding === "true" ? <DashboardLobby initialData={null} /> : <ClientHub />;
}

export default function Page(props: { searchParams: Promise<{ onboarding?: string }> }) {
  return (
    <Suspense fallback={<p>Loading account…</p>}>
      <DashboardContent {...props} />
    </Suspense>
  );
}
