"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Filter, MessageCircle, RefreshCcw, Search, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminBlogCommentDto } from "@/lib/api/types";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function badgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "visible") return "default";
  if (status === "deleted") return "destructive";
  return "secondary";
}

export function AdminBlogComments({ initialData }: { initialData?: AdminBlogCommentDto[] | null }) {
  const [comments, setComments] = useState<AdminBlogCommentDto[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadComments = async (nextSearch = search, nextStatus = statusFilter) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (nextSearch.trim()) params.set("search", nextSearch.trim());
      params.set("status", nextStatus);
      const response = await fetch(`/api/admin/blog/comments?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to load blog comments.");
      const payload = (await response.json()) as AdminBlogCommentDto[];
      setComments(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load blog comments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialData) return;
    void loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const summary = useMemo(() => {
    const visible = comments.filter((comment) => comment.status === "visible").length;
    const hidden = comments.filter((comment) => comment.status === "hidden").length;
    const replies = comments.filter((comment) => comment.parentId).length;
    return { visible, hidden, replies };
  }, [comments]);

  const updateComment = async (id: string, action: "hide" | "show" | "delete") => {
    setUpdatingId(id);
    setError("");
    try {
      const response = await fetch("/api/admin/blog/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) throw new Error(payload?.message || "Failed to update comment.");
      await loadComments();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update comment.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout title="Blog Comments - Admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-brand-dark text-2xl">Blog Comments</h1>
            <p className="text-muted-foreground mt-1">
              Review the live comment stream, hide threads when needed, and remove spam or duplicate
              replies.
            </p>
          </div>
          <Button variant="outline" onClick={() => void loadComments()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">Visible</p>
              <p className="mt-2 text-3xl">{summary.visible}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">Hidden</p>
              <p className="mt-2 text-3xl">{summary.hidden}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">Replies</p>
              <p className="mt-2 text-3xl">{summary.replies}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4 pt-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Filter className="text-brand-accent h-4 w-4" />
              <span className="text-sm">Filters</span>
            </div>
            <div className="flex-1">
              <div className="flex gap-2">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search content, author, or email"
                />
                <Button variant="outline" onClick={() => void loadComments(search, statusFilter)}>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>
            <div className="w-full md:w-56">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  void loadComments(search, value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="visible">Visible</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading ? <p className="text-muted-foreground text-sm">Loading blog comments...</p> : null}

        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MessageCircle className="text-brand-accent h-5 w-5" />
                      {comment.authorName}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1 text-sm">{comment.authorEmail}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant={badgeVariant(comment.status)}>{comment.status}</Badge>
                      <Badge variant="outline">
                        {comment.parentId ? "Reply" : "Top-level comment"}
                      </Badge>
                      {comment.replyCount > 0 ? (
                        <Badge variant="outline">{comment.replyCount} replies</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-muted-foreground text-sm md:text-right">
                    <p>{formatDateTime(comment.createdAt)}</p>
                    <Link
                      href={`/blog/${comment.postSlug}`}
                      className="text-primary mt-2 inline-block underline"
                    >
                      View post
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </div>
                <div className="flex flex-wrap gap-2">
                  {comment.status !== "visible" ? (
                    <Button
                      variant="outline"
                      disabled={updatingId === comment.id}
                      onClick={() => void updateComment(comment.id, "show")}
                    >
                      Restore
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      disabled={updatingId === comment.id}
                      onClick={() => void updateComment(comment.id, "hide")}
                    >
                      Hide thread
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="text-red-700"
                    disabled={updatingId === comment.id}
                    onClick={() => void updateComment(comment.id, "delete")}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && comments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No comments match the current filters.</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AdminLayout>
  );
}
