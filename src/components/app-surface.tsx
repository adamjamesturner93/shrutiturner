import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils";

export function AppPageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("app-page-header", className)}>
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-3">
          {eyebrow ? <p className="app-page-eyebrow">{eyebrow}</p> : null}
          <div className="space-y-3">
            <h1 className="app-page-title">{title}</h1>
            {description ? <p className="app-page-description">{description}</p> : null}
          </div>
          {meta ? <div className="app-page-meta">{meta}</div> : null}
        </div>
        {actions ? <div className="app-page-actions">{actions}</div> : null}
      </div>
    </section>
  );
}

export function AppMetricGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("app-metric-grid", className)}>{children}</div>;
}

export function AppMetricCard({
  label,
  value,
  detail,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("app-metric-card", className)}>
      <p className="app-metric-label">{label}</p>
      <p className="app-metric-value">{value}</p>
      {detail ? <p className="app-metric-detail">{detail}</p> : null}
    </article>
  );
}

export function AppPanel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("app-panel", className)}>{children}</div>;
}

export function AppEmptyState({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("app-empty-state", className)}>
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <h2 className="text-2xl md:text-3xl">{title}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed md:text-base">{description}</p>
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </section>
  );
}
