import type { Metadata } from "next";
import { getRetreatBalancePaymentStateByToken } from "@/lib/retreats/service";
import { RetreatBalancePage } from "@/views/retreat-balance";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;

  try {
    const state = await getRetreatBalancePaymentStateByToken(token);
    return {
      title: `${state.retreatTitle} Balance Payment`,
      robots: { index: false, follow: false },
    };
  } catch {
    return {
      title: "Retreat Balance Payment",
      robots: { index: false, follow: false },
    };
  }
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let initialData = null;

  try {
    initialData = await getRetreatBalancePaymentStateByToken(token);
  } catch {
    initialData = null;
  }

  return <RetreatBalancePage token={token} initialData={initialData} />;
}
