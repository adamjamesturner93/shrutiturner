import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicHoldingGuard } from "@/components/public-holding-guard";
import { isHoldingStage } from "@/lib/site-stage";

export const metadata: Metadata = {
  title: {
    default: "Personal Training & Movement Coaching | Shruti Turner",
    template: "%s | Shruti Turner",
  },
  description:
    "Personal movement and fitness coaching bringing together rehabilitation, fitness and wellbeing around your body, goals and real life.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={children}>
      <PublicHoldingGuard holdingMode={isHoldingStage()}>{children}</PublicHoldingGuard>
    </Suspense>
  );
}
