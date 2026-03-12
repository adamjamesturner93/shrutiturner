import { MembershipPage } from "@/views/dashboard/membership";
import { auth } from "@/lib/auth";
import { getMembershipState } from "@/lib/membership/membership-service";
import { getBillingHistory } from "@/lib/billing/history-service";

export default async function Page() {
  const session = await auth();
  const userId = session?.user?.id;
  const [initialState, initialHistory] = userId
    ? await Promise.all([getMembershipState(userId), getBillingHistory(userId, 30)])
    : [null, []];
  return <MembershipPage initialState={initialState} initialHistory={initialHistory} />;
}
