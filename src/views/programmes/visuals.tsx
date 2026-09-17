import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sprout } from "lucide-react";
import type { ReactNode } from "react";

export function StatusPill({
  children,
  attention = false,
}: {
  children: ReactNode;
  attention?: boolean;
}) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${attention ? "bg-amber-100 text-amber-950" : "bg-brand-accent-light text-brand-dark"}`}
    >
      {children}
    </span>
  );
}
export function ActionLink({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Button asChild size="lg" variant={secondary ? "outline" : "default"} className="min-h-11">
      <Link href={href}>
        {children}
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </Button>
  );
}
export function ProgrammeVisual({
  image,
  alt,
  compact = false,
}: {
  image?: string | null;
  alt?: string | null;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-[#e5e9df] ${compact ? "h-40" : "h-full min-h-72"}`}
    >
      {image ? (
        <ImageWithFallback
          src={image}
          alt={alt || ""}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(135deg,#e9ece3,#d5dfce)]"
        >
          <div className="absolute -right-12 -bottom-28 h-96 w-72 rotate-[-25deg] rounded-[50%] border-[32px] border-[#b5c5ac]/50" />
          <div className="absolute -top-20 -left-8 h-80 w-56 rotate-[28deg] rounded-[50%] border-[28px] border-white/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sprout strokeWidth={1} className="h-24 w-24 text-[#56734f]" />
          </div>
        </div>
      )}
    </div>
  );
}
export const eyebrow = "text-brand-accent text-xs font-medium uppercase tracking-[0.28em]";
export const cardSurface =
  "overflow-hidden rounded-[1.75rem] border border-brand-dark/10 bg-background shadow-[0_20px_50px_rgba(46,31,51,0.05)]";
