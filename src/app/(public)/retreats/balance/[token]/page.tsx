import { RetreatBalancePage } from "@/views/retreat-balance";
import { getRetreatBalancePaymentStateByToken } from "@/lib/retreats/service";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const initialData = await getRetreatBalancePaymentStateByToken(token);
  return <RetreatBalancePage token={token} initialData={initialData} />;
}
