import type { Metadata } from "next";
import { RetreatBalancePage } from "@/views/retreat-balance";
import { getRetreatBalancePaymentStateByToken } from "@/lib/retreats/service";

export const metadata: Metadata = {
  title: "Retreat balance payment",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const initialData = await getRetreatBalancePaymentStateByToken(token);
  return <RetreatBalancePage token={token} initialData={initialData} />;
}
