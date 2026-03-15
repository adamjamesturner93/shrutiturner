import { useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle, Reply, Trash2, CornerDownRight, AlertTriangle } from "lucide-react";
import { AuthContext } from "../context/auth-context";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useI18n } from "../lib/use-i18n";
import type { BlogCommentDto, BlogEngagementDto } from "@/lib/api/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface BlogCommentsProps {
  postId: string;
}

export function BlogComments({ postId }: BlogCommentsProps) {
  const auth = useContext(AuthContext);
  const { fmtDateTime } = useI18n();
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const isAdmin = auth?.isAdmin ?? false;

  const [comments, setComments] = useState<BlogCommentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const loadComments = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/blog/${postId}/engagement`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load comments.");
      const data = (await response.json()) as BlogEngagementDto;
      setComments(data.comments || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load comments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadComments();
  }, [postId]);

  const commentCount = useMemo(
    () => comments.reduce((count, comment) => count + 1 + (comment.replies?.length || 0), 0),
    [comments]
  );

  const postComment = async (content: string, parentId?: string | null) => {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/blog/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId: parentId || null }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to post comment.");
      }
      await loadComments();
      setNewComment("");
      setReplyText("");
      setReplyingTo(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const moderateComment = async (id: string, action: "hide" | "show" | "delete") => {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/admin/blog/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to update comment.");
      }
      await loadComments();
    } catch (moderationError) {
      setError(
        moderationError instanceof Error ? moderationError.message : "Failed to update comment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderAvatar = (initials: string, isInstructor: boolean) => (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs ${
        isInstructor ? "bg-brand-accent text-brand-white" : "bg-secondary text-secondary-foreground"
      }`}
    >
      {initials}
    </div>
  );

  const renderDeleteButton = (comment: BlogCommentDto, hasReplies: boolean) => {
    if (!isAdmin) return null;

    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive h-7 px-2 opacity-0 transition-opacity group-hover:opacity-100"
            aria-label={hasReplies ? "Delete thread" : "Delete comment"}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive h-5 w-5" />
              {hasReplies ? "Delete entire thread?" : "Delete comment?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {hasReplies
                ? `This will delete the comment and its ${comment.replies?.length || 0} ${comment.replies?.length === 1 ? "reply" : "replies"}.`
                : "This will delete the comment."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void moderateComment(comment.id, "delete")}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  const renderComment = (comment: BlogCommentDto, isReply = false) => {
    const isInstructor = comment.authorName === "Shruti Turner";
    const replies = isReply ? [] : comment.replies || [];

    return (
      <div key={comment.id} className={isReply ? "ml-6 md:ml-10" : ""}>
        <div className="group flex gap-3 py-4">
          {isReply ? (
            <CornerDownRight className="text-muted-foreground/40 mt-2.5 h-4 w-4 shrink-0" />
          ) : null}
          {renderAvatar(comment.authorInitials, isInstructor)}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-sm ${isInstructor ? "text-brand-accent" : ""}`}>
                {comment.authorName}
              </span>
              <span className="text-muted-foreground text-xs">
                {fmtDateTime(comment.createdAt)}
              </span>
              {isInstructor ? (
                <span className="bg-brand-accent/10 text-brand-accent rounded px-2 py-0.5 text-[11px]">
                  Instructor
                </span>
              ) : null}
            </div>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>

            <div className="mt-3 flex items-center gap-2">
              {!isReply ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  disabled={!isAuthenticated}
                >
                  <Reply className="h-3.5 w-3.5" />
                  Reply
                </Button>
              ) : null}
              {renderDeleteButton(comment, replies.length > 0)}
            </div>

            {replyingTo === comment.id ? (
              <div className="mt-4 space-y-3 rounded-lg border p-4">
                <Textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder="Write your reply..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => void postComment(replyText, comment.id)}
                    disabled={!replyText.trim() || submitting}
                  >
                    Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            {replies.length > 0 ? (
              <div className="mt-4 space-y-1">
                {replies.map((reply) => renderComment(reply, true))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="mt-16 border-t pt-12">
      <div className="mb-8 flex items-center gap-3">
        <MessageCircle className="text-brand-accent h-5 w-5" />
        <h2 className="text-2xl md:text-3xl">Discussion</h2>
        <span className="text-muted-foreground text-sm">({commentCount})</span>
      </div>

      {!isAuthenticated ? (
        <div className="bg-secondary/20 mb-8 rounded-lg border p-5">
          <p className="text-muted-foreground text-sm leading-relaxed">
            <Link href="/login" className="text-primary underline">
              Log in
            </Link>{" "}
            to add a comment or reply.
          </p>
        </div>
      ) : (
        <div className="mb-8 space-y-3 rounded-lg border p-5">
          <Textarea
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            placeholder="Add your thoughts..."
            rows={4}
          />
          <div className="flex justify-end">
            <Button
              onClick={() => void postComment(newComment)}
              disabled={!newComment.trim() || submitting}
            >
              Post comment
            </Button>
          </div>
        </div>
      )}

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      {loading ? <p className="text-muted-foreground text-sm">Loading comments...</p> : null}

      {!loading && comments.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
          No comments yet. Start the conversation.
        </div>
      ) : null}

      {!loading && comments.length > 0 ? (
        <div className="space-y-1">{comments.map((comment) => renderComment(comment))}</div>
      ) : null}
    </section>
  );
}
