import type { Metadata } from "next";
import { getGiftRedemptionState } from "@/lib/gifts/service";
import { GiftRedeemPage } from "@/views/gift-redeem";

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

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const initialState = await getGiftRedemptionState(code);
  return <GiftRedeemPage code={code} initialState={initialState} />;
}
