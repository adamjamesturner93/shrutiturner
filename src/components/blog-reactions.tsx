import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import type { BlogEngagementDto } from "@/lib/api/types";

interface BlogReactionsProps {
  postId: string;
}

export function BlogReactions({ postId }: BlogReactionsProps) {
  const [hasReacted, setHasReacted] = useState(false);
  const [count, setCount] = useState(0);

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
    const response = await fetch(`/api/blog/${postId}/reactions/toggle`, {
      method: "POST",
    });
    if (!response.ok) return;
    const data = (await response.json()) as { hasReacted: boolean; reactionCount: number };
    setHasReacted(data.hasReacted);
    setCount(data.reactionCount);
  };

  return (
    <div className="flex items-center gap-3">
      <motion.div whileTap={{ scale: 1.3 }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void handleToggle()}
          className={`gap-2 rounded-full border px-3 py-2 transition-colors ${
            hasReacted
              ? "border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10"
              : "border-border text-muted-foreground hover:border-destructive/30 hover:text-destructive"
          }`}
          aria-label={hasReacted ? "Remove reaction" : "React with heart"}
          aria-pressed={hasReacted}
        >
          <Heart
            className={`h-5 w-5 transition-all ${
              hasReacted ? "fill-destructive text-destructive" : ""
            }`}
          />
          <span className="text-sm tabular-nums">{count}</span>
        </Button>
      </motion.div>
    </div>
  );
}
