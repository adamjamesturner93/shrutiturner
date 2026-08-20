import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/components/ui/utils";

type LoadingRegionProps = {
  children: ReactNode;
  label: string;
  className?: string;
};

/**
 * Gives every visual loading placeholder one concise announcement while keeping
 * its decorative shapes out of the accessibility tree.
 */
export function LoadingRegion({ children, label, className }: LoadingRegionProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" aria-label={label} className={className}>
      <div aria-hidden="true" className={cn("min-w-0")}>
        {children}
      </div>
    </div>
  );
}

export function InlineLoadingStatus({ label, className }: { label: string; className?: string }) {
  return (
    <p
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn("text-muted-foreground flex items-center gap-2 text-sm", className)}
    >
      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </p>
  );
}
