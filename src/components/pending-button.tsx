import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type PendingButtonProps = React.ComponentProps<typeof Button> & {
  pending: boolean;
  pendingLabel: string;
};

export function PendingButton({
  pending,
  pendingLabel,
  disabled,
  children,
  ...props
}: PendingButtonProps) {
  return (
    <Button {...props} disabled={disabled || pending} aria-busy={pending || undefined}>
      {pending ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
