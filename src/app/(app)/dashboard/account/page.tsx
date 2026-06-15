import { getAccount } from "@/lib/account/account-service";
import { getBaseSiteUrl } from "@/lib/app-url";
import { requireAuth } from "@/lib/auth";
import { AccountPage } from "@/views/account";

export default async function Page() {
  const session = await requireAuth();
  const userId = session.user.id;

  const account = await getAccount(userId, getBaseSiteUrl());

  return <AccountPage initialAccount={account} />;
}
