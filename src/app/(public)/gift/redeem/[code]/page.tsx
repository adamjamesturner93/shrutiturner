import type { Metadata } from "next";
import { Suspense } from "react";
import { getGiftRedemptionState } from "@/lib/gifts/service";
import { GiftRedeemPage } from "@/views/gift-redeem";
import { auth } from "@/lib/auth";
import { getGiftRecipientWorkshopSetupState } from "@/lib/gifts/service";
import { GiftRedeemPageLoading } from "@/components/public-loading";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const state = await getGiftRedemptionState(code);
  return {
    title: state.gift ? `Redeem ${state.gift.productTitle}` : "Redeem Gift",
    robots: { index: false, follow: false },
  };
}

export default function Page({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense fallback={<GiftRedeemPageLoading />}>
      <GiftRedeemContent params={params} />
    </Suspense>
  );
}

async function GiftRedeemContent({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const initialState = await getGiftRedemptionState(code);
  const session = await auth();
  const initialSetupState = session?.user?.id
    ? await getGiftRecipientWorkshopSetupState(code, session.user.id)
        .then((result) => result.setup)
        .catch(() => null)
    : null;
  return (
    <GiftRedeemPage code={code} initialState={initialState} initialSetupState={initialSetupState} />
  );
}
