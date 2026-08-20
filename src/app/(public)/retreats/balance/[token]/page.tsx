import type { Metadata } from "next";
import { Suspense } from "react";
import { RetreatBalancePage } from "@/views/retreat-balance";
import { getRetreatBalancePaymentStateByToken } from "@/lib/retreats/service";
import { RetreatBalancePageLoading } from "@/components/public-loading";

export const metadata: Metadata = {
  title: "Retreat balance payment",
  robots: { index: false, follow: false },
};

export default function Page({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense fallback={<RetreatBalancePageLoading />}>
      <RetreatBalanceContent params={params} />
    </Suspense>
  );
}

async function RetreatBalanceContent({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const initialData = await getRetreatBalancePaymentStateByToken(token);
  return <RetreatBalancePage token={token} initialData={initialData} />;
}
