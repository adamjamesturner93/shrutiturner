"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isHoldingAllowedPathname, isHoldingBypassPathname } from "@/lib/site-stage";

interface PublicHoldingGuardProps {
  children: React.ReactNode;
  holdingMode: boolean;
}

export function PublicHoldingGuard({ children, holdingMode }: PublicHoldingGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isBlockedRoute =
    holdingMode && !isHoldingAllowedPathname(pathname) && !isHoldingBypassPathname(pathname);

  useEffect(() => {
    if (isBlockedRoute) {
      router.replace("/");
    }
  }, [isBlockedRoute, router]);

  if (isBlockedRoute) {
    return null;
  }

  return children;
}
