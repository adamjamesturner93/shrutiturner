import { Suspense } from "react";
import { getAccount } from "@/lib/account/account-service";
import { getBaseSiteUrl } from "@/lib/app-url";
import { requireAuth } from "@/lib/auth";
import { AccountPage } from "@/views/account";
import AppLoading from "../loading";

export default function Page() {
  return (
    <Suspense fallback={<AppLoading />}>
      <AccountContent />
    </Suspense>
  );
}

async function AccountContent() {
  const session = await requireAuth();
  const userId = session.user.id;

  const account = await getAccount(userId, getBaseSiteUrl());

  return <AccountPage initialAccount={account} />;
}
