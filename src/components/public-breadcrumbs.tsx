import Link from "next/link";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/components/ui/utils";
import { buildBreadcrumbJsonLd, type PublicBreadcrumbItem } from "@/lib/seo/breadcrumbs";

export function PublicBreadcrumbs({
  items,
  inverted = false,
  className,
}: {
  items: PublicBreadcrumbItem[];
  inverted?: boolean;
  className?: string;
}) {
  if (items.length === 0) return null;
  const lastIndex = items.length - 1;

  return (
    <>
      <Breadcrumb className={cn("max-w-full", className)}>
        <BreadcrumbList
          className={cn(
            "flex-nowrap overflow-hidden",
            inverted ? "text-brand-white/68" : "text-muted-foreground"
          )}
        >
          {items.map((item, index) => {
            const isLast = index === lastIndex;
            return (
              <Fragment key={`${item.href}-${item.name}`}>
                <BreadcrumbItem className="min-w-0 shrink">
                  {isLast ? (
                    <BreadcrumbPage
                      className={cn(
                        "block max-w-[13rem] truncate sm:max-w-xs md:max-w-md",
                        inverted ? "text-brand-white" : "text-foreground"
                      )}
                      title={item.name}
                    >
                      {item.name}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "rounded-sm whitespace-nowrap underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:outline-none",
                          inverted
                            ? "text-brand-white/80 hover:text-brand-white focus-visible:ring-brand-accent-light focus-visible:ring-offset-brand-dark hover:underline focus-visible:ring-offset-2"
                            : "hover:text-foreground focus-visible:ring-ring hover:underline focus-visible:ring-offset-2"
                        )}
                      >
                        {item.name}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast ? <BreadcrumbSeparator className="shrink-0" /> : null}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(items)) }}
      />
    </>
  );
}
