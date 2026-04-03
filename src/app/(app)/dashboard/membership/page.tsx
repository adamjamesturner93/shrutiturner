import { MembershipPage } from "@/views/dashboard/membership";
import { auth } from "@/lib/auth";
import { getMembershipState } from "@/lib/membership/membership-service";
import { getBillingHistory } from "@/lib/billing/history-service";
import { getPublicPricing } from "@/lib/billing/public-pricing";

export default async function Page() {
  const session = await auth();
  const userId = session?.user?.id;
  const [initialState, initialHistory, initialPricing] = await Promise.all([
    userId ? getMembershipState(userId) : Promise.resolve(null),
    userId ? getBillingHistory(userId, 30) : Promise.resolve([]),
    getPublicPricing(),
  ]);

  return (
    <MembershipPage
      initialState={initialState}
      initialHistory={initialHistory}
      initialPricing={initialPricing}
    />
  );
}
