import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RetreatCheckoutPage } from "@/views/retreat-checkout";
import { getOperationalRetreatBySlug } from "@/lib/retreats/service";
import { RetreatCheckoutPageLoading } from "@/components/public-loading";

export const metadata: Metadata = {
  title: "Retreat checkout",
  robots: { index: false, follow: false },
};

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<RetreatCheckoutPageLoading />}>
      <RetreatCheckoutContent params={params} />
    </Suspense>
  );
}

async function RetreatCheckoutContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const retreat = await getOperationalRetreatBySlug(slug);
  if (!retreat) notFound();
  return <RetreatCheckoutPage retreat={retreat} />;
}
