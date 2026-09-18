"use client";
import Link, { useLinkStatus } from "next/link";
import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
function Pending({ loading }: { loading?: boolean }) {
  const { pending } = useLinkStatus();
  return pending || loading ? (
    <LoaderCircle aria-hidden="true" className="h-3 w-3 animate-spin motion-reduce:animate-none" />
  ) : null;
}
export function ProgrammeNavigationLink({
  href,
  active,
  loading,
  children,
}: {
  href: string;
  active: boolean;
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      scroll={false}
      prefetch
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${active ? "bg-brand-dark text-white shadow-sm" : "text-brand-dark hover:bg-background"}`}
    >
      <span>{children}</span>
      <Pending loading={loading} />
    </Link>
  );
}
