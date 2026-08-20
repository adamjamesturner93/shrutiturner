import { useEffect, useState } from "react";
import { Heart, LoaderCircle } from "lucide-react";
import { motion } from "motion/react";
import type { BlogEngagementDto } from "@/lib/api/types";
import { cn } from "./ui/utils";

interface BlogReactionsProps {
  postId: string;
}

export function BlogReactions({ postId }: BlogReactionsProps) {
  const [hasReacted, setHasReacted] = useState(false);
  const [count, setCount] = useState(0);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch(`/api/blog/${postId}/engagement`, { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as BlogEngagementDto;
        if (!active) return;
        setHasReacted(data.hasReacted);
        setCount(data.reactionCount);
      } catch {
        // Leave defaults in place.
      }
    })();

    return () => {
      active = false;
    };
  }, [postId]);

  const handleToggle = async () => {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch(`/api/blog/${postId}/reactions/toggle`, {
        method: "POST",
      });
      if (!response.ok) return;
      const data = (await response.json()) as { hasReacted: boolean; reactionCount: number };
      setHasReacted(data.hasReacted);
      setCount(data.reactionCount);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <motion.div whileTap={{ scale: 1.12 }}>
        <button
          type="button"
          onClick={() => void handleToggle()}
          disabled={pending}
          aria-busy={pending || undefined}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-base font-semibold shadow-sm transition-all hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:outline-none",
            hasReacted
              ? "border-destructive bg-destructive/10 text-destructive hover:border-destructive hover:bg-destructive/15 hover:text-destructive focus-visible:ring-destructive/25"
              : "border-brand-accent/45 bg-brand-warm/70 text-brand-accent hover:border-destructive/45 hover:bg-destructive/8 hover:text-destructive focus-visible:ring-brand-accent/25"
          )}
          aria-label={hasReacted ? "Remove reaction" : "React with heart"}
          aria-pressed={hasReacted}
        >
          {pending ? (
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <Heart
              className={`h-5 w-5 transition-all ${
                hasReacted ? "fill-destructive text-destructive" : ""
              }`}
            />
          )}
          <span className={count > 0 ? "tabular-nums" : undefined}>
            {count > 0 ? count : "Helpful"}
          </span>
        </button>
      </motion.div>
    </div>
  );
}
