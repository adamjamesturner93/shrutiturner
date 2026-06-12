import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicHoldingGuard } from "@/components/public-holding-guard";
import { isHoldingStage } from "@/lib/site-stage";

export const metadata: Metadata = {
  title: {
    default: "Shruti Turner",
    template: "%s | Shruti Turner",
  },
  description:
    "Science-backed movement coaching for adults with chronic illness, autoimmune conditions and recovering from injury.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={children}>
      <PublicHoldingGuard holdingMode={isHoldingStage()}>{children}</PublicHoldingGuard>
    </Suspense>
  );
}
