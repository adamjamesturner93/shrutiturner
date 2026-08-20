import { cn } from "./utils";

function Skeleton({
  className,
  "aria-hidden": ariaHidden = true,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden={ariaHidden}
      className={cn("bg-muted animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
