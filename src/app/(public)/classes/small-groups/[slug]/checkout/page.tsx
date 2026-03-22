import type { Metadata } from "next";
import { connection } from "next/server";
import { getPublicProgrammeCheckoutState } from "@/lib/small-groups/service";
import { ProgrammeCheckoutPage } from "@/views/programme-checkout";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearch = await searchParams;
  const runSlug = typeof resolvedSearch.run === "string" ? resolvedSearch.run : undefined;
  const state = await getPublicProgrammeCheckoutState(slug, runSlug);
  return {
    title: state.template ? `Checkout ${state.template.title}` : "Programme Checkout",
    robots: { index: false, follow: false },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const { slug } = await params;
  const resolvedSearch = await searchParams;
  const runSlug = typeof resolvedSearch.run === "string" ? resolvedSearch.run : undefined;
  const initialState = await getPublicProgrammeCheckoutState(slug, runSlug);
  return <ProgrammeCheckoutPage templateSlug={slug} initialState={initialState} />;
}
