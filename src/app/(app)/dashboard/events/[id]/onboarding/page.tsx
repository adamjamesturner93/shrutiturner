import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ProgrammeOnboarding } from "@/views/programmes/onboarding";
async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<p>Loading onboarding…</p>}>
      <DashboardLayout handlesLegalAgreements title="Event onboarding">
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          <h1 className="text-3xl">Your event health confirmation</h1>
          <ProgrammeOnboarding id={id} event />
        </div>
      </DashboardLayout>
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
