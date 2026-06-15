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
                        inverted ? "text-brand-accent-light" : "text-foreground"
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
                          "whitespace-nowrap",
                          inverted ? "hover:text-brand-accent-light" : undefined
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
