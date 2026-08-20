import { Suspense } from "react";
import { getAccount } from "@/lib/account/account-service";
import { getBaseSiteUrl } from "@/lib/app-url";
import { requireAuth } from "@/lib/auth";
import { AccountPage } from "@/views/account";
import DashboardAccountLoading from "./loading";

export default function Page() {
  return (
    <Suspense fallback={<DashboardAccountLoading />}>
      <DashboardAccountContent />
    </Suspense>
  );
}

async function DashboardAccountContent() {
  const session = await requireAuth();
  const userId = session.user.id;

  const account = await getAccount(userId, getBaseSiteUrl());

  return <AccountPage initialAccount={account} />;
}
