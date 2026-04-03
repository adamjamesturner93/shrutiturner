import { getAccountActivity } from "@/lib/account/account-activity-service";
import { getAccount } from "@/lib/account/account-service";
import { getBaseSiteUrl } from "@/lib/app-url";
import { requireAuth } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/dashboard/dashboard-service";
import { AccountPage } from "@/views/account";

export default async function Page() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [account, dashboardSummary, activity] = await Promise.all([
    getAccount(userId, getBaseSiteUrl()),
    getDashboardSummary(userId),
    getAccountActivity(userId),
  ]);

  return (
    <AccountPage
      initialAccount={account}
      initialDashboardSummary={dashboardSummary}
      initialActivity={activity}
    />
  );
}
