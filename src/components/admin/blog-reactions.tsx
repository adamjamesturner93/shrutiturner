"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ReactionSummary = { postSlug: string; title: string; count: number };

export function AdminBlogReactions({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = useState<ReactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    fetch("/api/admin/blog/reactions", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load reactions");
        const data: ReactionSummary[] = await response.json();
        if (!controller.signal.aborted) setRows(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refreshKey, retry]);
  return (
    <Card role="region" aria-label="Blog reactions" aria-busy={loading}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart aria-hidden="true" className="text-brand-accent h-5 w-5" /> Blog reactions
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Likes across all posts, including posts without comments. Comment filters below do not
          affect these totals.
        </p>
      </CardHeader>
      <CardContent>
        {error ? (
          <div role="alert">
            Unable to load reactions.{" "}
            <Button variant="outline" onClick={() => setRetry((value) => value + 1)}>
              Try again
            </Button>
          </div>
        ) : loading ? (
          <p role="status">Loading reactions…</p>
        ) : (
          <>
            <p className="mb-4 font-semibold">
              {rows.reduce((sum, row) => sum + row.count, 0)} likes in total
            </p>
            {rows.length ? (
              <ul className="divide-y">
                {rows.map((row) => (
                  <li key={row.postSlug} className="flex items-center justify-between gap-4 py-3">
                    <Link
                      className="capitalize underline underline-offset-4"
                      href={`/blog/${encodeURIComponent(row.postSlug)}`}
                    >
                      {row.title}
                    </Link>
                    <span className="bg-brand-accent/10 shrink-0 rounded-full px-3 py-1 text-sm">
                      {row.count} {row.count === 1 ? "like" : "likes"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                No likes yet. Reactions will appear here when readers like a post.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
