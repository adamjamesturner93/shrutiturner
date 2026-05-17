import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";

interface MarketingSectionProps {
  children: ReactNode;
  id?: string;
  className?: string;
  contentClassName?: string;
  compact?: boolean;
}

export function MarketingSection({
  children,
  id,
  className,
  contentClassName,
  compact = false,
}: MarketingSectionProps) {
  return (
    <section
      id={id}
      className={cn(compact ? "px-4 py-12 md:py-14" : "px-4 py-16 md:py-20", className)}
    >
      <div className={cn("container mx-auto max-w-6xl", contentClassName)}>{children}</div>
    </section>
  );
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  descriptionClassName?: string;
  eyebrowClassName?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  descriptionClassName,
  eyebrowClassName,
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={cn(centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl", className)}>
      {eyebrow ? (
        <p
          className={cn(
            "text-brand-accent mb-4 text-xs font-medium tracking-[0.28em] uppercase",
            eyebrowClassName
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl leading-tight md:text-5xl">{title}</h2>
      {description ? (
        <p
          className={cn(
            "text-muted-foreground mt-5 text-lg leading-relaxed md:text-xl",
            descriptionClassName
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

interface HeroStat {
  label: string;
  value: string;
}

interface HeroMetric {
  label: string;
  detail: string;
}

interface EditorialHeroProps {
  eyebrow: string;
  title: ReactNode;
  description: string;
  size?: "default" | "compact";
  primaryCta: {
    href: string;
    label: string;
  };
  secondaryCta?: {
    href: string;
    label: string;
  };
  aside: ReactNode;
  stats?: HeroStat[];
  metrics?: HeroMetric[];
}

export function EditorialHero({
  eyebrow,
  title,
  description,
  size = "default",
  primaryCta,
  secondaryCta,
  aside,
  stats = [],
  metrics = [],
}: EditorialHeroProps) {
  const compact = size === "compact";

  return (
    <section
      className={cn(
        "marketing-grid text-brand-white overflow-hidden px-4",
        compact ? "py-12 md:py-14" : "py-14 md:py-18"
      )}
    >
      <div className={cn("container mx-auto", compact ? "max-w-6xl" : "max-w-7xl")}>
        <div
          className={cn(
            "grid items-center lg:grid-cols-[1.05fr_0.95fr]",
            compact ? "gap-8 lg:gap-10" : "gap-10 lg:gap-14"
          )}
        >
          <div className="relative z-10">
            <p className="text-brand-accent-light mb-5 text-xs font-medium tracking-[0.3em] uppercase">
              {eyebrow}
            </p>
            <h1
              className={cn(
                "max-w-4xl leading-[1.08] tracking-[-0.03em]",
                compact ? "text-4xl md:text-5xl" : "text-4xl md:text-[clamp(3.25rem,5vw,5.5rem)]"
              )}
            >
              {title}
            </h1>
            <p
              className={cn(
                "text-brand-white/82 mt-5 max-w-2xl leading-relaxed",
                compact ? "text-base md:text-xl" : "text-lg md:text-[1.35rem]"
              )}
            >
              {description}
            </p>

            <div className={cn("flex flex-col gap-4 sm:flex-row", compact ? "mt-6" : "mt-7")}>
              <Button
                asChild
                size="lg"
                className="bg-brand-accent-light text-brand-dark hover:bg-brand-accent-light/90"
              >
                <Link href={primaryCta.href}>
                  {primaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              {secondaryCta ? (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-brand-white/25 bg-brand-white/6 text-brand-white hover:bg-brand-white/12"
                >
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              ) : null}
            </div>

            {stats.length > 0 ? (
              <div className={cn("grid gap-3 sm:grid-cols-3", compact ? "mt-7" : "mt-8")}>
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="border-brand-white/10 bg-brand-white/7 rounded-[1.25rem] border px-5 py-4 backdrop-blur-sm"
                  >
                    <p className="text-2xl">{stat.value}</p>
                    <p className="text-brand-white/65 mt-1 text-sm">{stat.label}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {metrics.length > 0 ? (
              <div
                className={cn(
                  "border-brand-white/12 grid gap-4 border-t md:grid-cols-3",
                  compact ? "mt-7 pt-6" : "mt-8 pt-7"
                )}
              >
                {metrics.map((metric) => (
                  <div key={metric.label}>
                    <p className="text-brand-white/55 text-xs tracking-[0.2em] uppercase">
                      {metric.label}
                    </p>
                    <p className="text-brand-white/80 mt-2 text-sm leading-relaxed">
                      {metric.detail}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative">{aside}</div>
        </div>
      </div>
    </section>
  );
}

interface StorySplitProps {
  eyebrow?: string;
  title: string;
  description?: string;
  body: ReactNode;
  aside: ReactNode;
  reverse?: boolean;
  className?: string;
}

export function StorySplit({
  eyebrow,
  title,
  description,
  body,
  aside,
  reverse = false,
  className,
}: StorySplitProps) {
  return (
    <MarketingSection className={className}>
      <div
        className={cn(
          "grid items-start gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12",
          reverse && "lg:grid-cols-[0.98fr_1.02fr]"
        )}
      >
        <div className={cn(reverse && "lg:order-2")}>
          <SectionHeading eyebrow={eyebrow} title={title} description={description} />
          <div className="mt-8">{body}</div>
        </div>
        <div className={cn("relative", reverse && "lg:order-1")}>{aside}</div>
      </div>
    </MarketingSection>
  );
}

interface PullQuoteProps {
  quote: string;
  attribution: string;
  className?: string;
}

export function PullQuote({ quote, attribution, className }: PullQuoteProps) {
  return (
    <blockquote
      className={cn(
        "border-brand-white/10 bg-brand-dark text-brand-white rounded-[1.75rem] border px-7 py-8 shadow-[0_24px_60px_rgba(46,31,51,0.18)]",
        className
      )}
    >
      <p className="text-2xl leading-relaxed md:text-3xl">{quote}</p>
      <footer className="text-brand-accent-light mt-6 text-sm tracking-[0.18em] uppercase">
        {attribution}
      </footer>
    </blockquote>
  );
}

interface ProofItem {
  label: string;
  detail: string;
}

interface ProofBandProps {
  title: string;
  description?: string;
  items: ProofItem[];
  className?: string;
}

export function ProofBand({ title, description, items, className }: ProofBandProps) {
  return (
    <MarketingSection className={cn("bg-brand-warm/70", className)} compact>
      <div className="border-brand-dark/10 bg-background/95 rounded-[2rem] border p-7 shadow-[0_30px_80px_rgba(46,31,51,0.06)] md:p-9">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <h3 className="text-2xl md:text-3xl">{title}</h3>
            {description ? (
              <p className="text-muted-foreground mt-4 max-w-xl leading-relaxed">{description}</p>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.label}
                className="border-brand-dark/8 bg-brand-white rounded-[1.35rem] border px-5 py-5"
              >
                <p className="text-brand-accent text-xs tracking-[0.2em] uppercase">{item.label}</p>
                <p className="text-foreground mt-3 text-sm leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MarketingSection>
  );
}

interface PathCardItem {
  title: string;
  description: string;
  detail: string;
  href: string;
  ctaLabel: string;
  icon: LucideIcon;
  accentClassName?: string;
  badge?: string;
}

interface PathCardsProps {
  items: PathCardItem[];
}

export function PathCards({ items }: PathCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article
            key={item.title}
            className="group border-brand-dark/10 bg-background relative flex h-full flex-col rounded-[1.75rem] border p-6 shadow-[0_20px_50px_rgba(46,31,51,0.06)] transition-transform duration-300 hover:-translate-y-1"
          >
            {item.badge ? (
              <span className="bg-brand-dark text-brand-white absolute top-5 right-5 rounded-full px-3 py-1 text-[11px] tracking-[0.18em] uppercase">
                {item.badge}
              </span>
            ) : null}
            <div
              className={cn(
                "bg-brand-accent/10 text-brand-accent mb-6 flex h-12 w-12 items-center justify-center rounded-2xl",
                item.accentClassName
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-2xl">{item.title}</h3>
            <p className="text-muted-foreground mt-4 flex-1 text-sm leading-relaxed">
              {item.description}
            </p>
            <p className="text-brand-dark mt-5 text-sm font-medium">{item.detail}</p>
            <Button asChild variant="outline" className="mt-6 justify-between">
              <Link href={item.href}>
                {item.ctaLabel}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </article>
        );
      })}
    </div>
  );
}

interface PreFooterCtaAction {
  href: string;
  label: string;
  icon?: LucideIcon;
  iconPosition?: "start" | "end";
  variant?: "primary" | "secondary";
}

interface PreFooterCtaSectionProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  actions?: PreFooterCtaAction[];
  aside?: ReactNode;
  children?: ReactNode;
  id?: string;
  className?: string;
  compact?: boolean;
  layout?: "split" | "centered";
}

function PreFooterCtaActions({
  actions,
  centered = false,
}: {
  actions: PreFooterCtaAction[];
  centered?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row",
        centered ? "justify-center" : "md:justify-end"
      )}
    >
      {actions.map((action) => {
        const Icon = action.icon;
        const isPrimary = action.variant !== "secondary";

        return (
          <Button
            key={`${action.href}-${action.label}`}
            asChild
            size="lg"
            variant={isPrimary ? "default" : "outline"}
            className={
              isPrimary
                ? "bg-brand-white text-brand-accent hover:bg-brand-white/90"
                : "border-brand-white/20 bg-brand-white/8 text-brand-white hover:bg-brand-white/12"
            }
          >
            <Link href={action.href}>
              {Icon && action.iconPosition === "start" ? <Icon className="h-4 w-4" /> : null}
              {action.label}
              {Icon && action.iconPosition !== "start" ? <Icon className="h-4 w-4" /> : null}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}

export function PreFooterCtaSection({
  title,
  description,
  eyebrow,
  actions = [],
  aside,
  children,
  id,
  className,
  compact = false,
  layout = "split",
}: PreFooterCtaSectionProps) {
  const centered = layout === "centered";

  return (
    <MarketingSection
      id={id}
      compact={compact}
      className={cn("bg-brand-accent text-brand-white", className)}
    >
      {centered ? (
        <div className="mx-auto max-w-4xl space-y-8 text-center">
          {eyebrow ? (
            <p className="text-brand-accent-light text-xs tracking-[0.2em] uppercase">{eyebrow}</p>
          ) : null}
          <div>
            <h2 className="text-3xl leading-tight md:text-5xl">{title}</h2>
            {description ? (
              <p className="text-brand-white/84 mx-auto mt-5 max-w-2xl text-lg leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>
          {children}
          {actions.length > 0 ? <PreFooterCtaActions actions={actions} centered /> : null}
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-8 md:items-center",
            aside ? "lg:grid-cols-[0.95fr_1.05fr] lg:items-start" : "md:grid-cols-[1fr_auto]"
          )}
        >
          <div>
            {eyebrow ? (
              <p className="text-brand-accent-light text-xs tracking-[0.2em] uppercase">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mt-4 text-3xl leading-tight md:text-5xl">{title}</h2>
            {description ? (
              <p className="text-brand-white/84 mt-5 max-w-2xl text-lg leading-relaxed">
                {description}
              </p>
            ) : null}
            {children ? <div className="mt-8">{children}</div> : null}
            {aside && actions.length > 0 ? (
              <div className="mt-8">
                <PreFooterCtaActions actions={actions} />
              </div>
            ) : null}
          </div>
          {aside ? aside : actions.length > 0 ? <PreFooterCtaActions actions={actions} /> : null}
        </div>
      )}
    </MarketingSection>
  );
}

interface JourneyStep {
  title: string;
  description: string;
}

interface JourneySectionProps {
  steps: JourneyStep[];
  className?: string;
}

export function JourneySection({ steps, className }: JourneySectionProps) {
  return (
    <div className={cn("grid gap-5 md:grid-cols-2 xl:grid-cols-4", className)}>
      {steps.map((step, index) => (
        <article
          key={step.title}
          className="border-brand-dark/10 bg-background text-foreground flex h-full flex-col rounded-[1.5rem] border p-6 shadow-[0_18px_40px_rgba(46,31,51,0.05)]"
        >
          <div className="text-brand-accent mb-5 text-xs tracking-[0.22em] uppercase">
            Step {index + 1}
          </div>
          <h3 className="text-[clamp(1.45rem,1.7vw,1.85rem)] leading-tight">{step.title}</h3>
          <p className="text-muted-foreground mt-4 flex-1 text-sm leading-relaxed">
            {step.description}
          </p>
        </article>
      ))}
    </div>
  );
}
