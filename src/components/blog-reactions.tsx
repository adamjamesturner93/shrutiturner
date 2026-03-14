import { useState, useContext } from "react";
import { Heart } from "lucide-react";
import { Button } from "./ui/button";
import { AuthContext } from "../context/auth-context";
import { motion } from "motion/react";
import Link from "next/link";

interface BlogReactionsProps {
  postId: string;
  /** Initial count from API (in production) */
  initialCount?: number;
}

/**
 * Single heart reaction for blog posts.
 * In production: POST /api/blog/:slug/reactions (toggle).
 * Anonymous users can see the count but must log in to react.
 */
export function BlogReactions({ postId, initialCount = 0 }: BlogReactionsProps) {
  const auth = useContext(AuthContext);
  const isAuthenticated = auth?.isAuthenticated ?? false;

  // Mock: per-post reaction state — in production this comes from the API
  const [hasReacted, setHasReacted] = useState(false);
  const [count, setCount] = useState(() => {
    // Seed some mock counts based on post ID
    const mockCounts: Record<string, number> = {
      "strength-training-chronic-illness": 24,
      "adaptive-yoga-vs-mainstream": 18,
      "programming-around-flares": 31,
      "hypermobility-strength-training": 15,
      "arthritis-exercise-guide": 22,
      "building-training-capacity": 19,
    };
    return initialCount || mockCounts[postId] || 0;
  });
  const [showLoginHint, setShowLoginHint] = useState(false);

  const handleToggle = () => {
    if (!isAuthenticated) {
      setShowLoginHint(true);
      setTimeout(() => setShowLoginHint(false), 3000);
      return;
    }

    if (hasReacted) {
      setHasReacted(false);
      setCount((c) => Math.max(0, c - 1));
    } else {
      setHasReacted(true);
      setCount((c) => c + 1);
    }
    // In production: POST /api/blog/:slug/reactions { action: hasReacted ? 'remove' : 'add' }
  };

  return (
    <div className="flex items-center gap-3">
      <motion.div whileTap={isAuthenticated ? { scale: 1.3 } : undefined}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
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

      {showLoginHint && (
        <motion.span
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          className="text-muted-foreground text-sm"
        >
          <Link href="/login" className="hover:text-primary underline">
            Log in
          </Link>{" "}
          to react
        </motion.span>
      )}
    </div>
  );
}
