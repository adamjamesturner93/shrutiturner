import { useState, useContext, useMemo } from "react";
import { AuthContext } from "../context/auth-context";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { MessageCircle, Reply, Trash2, CornerDownRight, AlertTriangle } from "lucide-react";
import { useI18n } from "../lib/use-i18n";
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
import Link from "next/link";

function createCommentId() {
  return `cmt_${crypto.randomUUID()}`;
}

/* ──────────── Types ──────────── */

interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  authorName: string;
  authorInitials: string;
  authorId: string;
  content: string;
  createdAt: string;
}

interface BlogCommentsProps {
  postId: string;
}

/* ──────────── Mock data ──────────── */

const MOCK_COMMENTS: Comment[] = [
  {
    id: "cmt_001",
    postId: "strength-training-chronic-illness",
    parentId: null,
    authorName: "Emily R.",
    authorInitials: "ER",
    authorId: "usr_010",
    content:
      "This really resonated with me. I've been trying to explain to my physio that generic gym programmes just don't work for me, and this article puts it into words perfectly. The three-tier system from the related flares article has been a game changer.",
    createdAt: "2026-02-16T14:30:00Z",
  },
  {
    id: "cmt_002",
    postId: "strength-training-chronic-illness",
    parentId: "cmt_001",
    authorName: "Shruti Turner",
    authorInitials: "ST",
    authorId: "admin_001",
    content:
      "Thanks Emily! It's so common to feel unheard in generic settings. Glad the tiered approach is helping you — that consistency over time is what makes the real difference.",
    createdAt: "2026-02-16T16:45:00Z",
  },
  {
    id: "cmt_003",
    postId: "strength-training-chronic-illness",
    parentId: null,
    authorName: "James K.",
    authorInitials: "JK",
    authorId: "usr_011",
    content:
      "Would love to see a follow-up article on specific exercises that work well for people with RA. The evidence section was really helpful.",
    createdAt: "2026-02-17T09:15:00Z",
  },
  {
    id: "cmt_004",
    postId: "adaptive-yoga-vs-mainstream",
    parentId: null,
    authorName: "Priya S.",
    authorInitials: "PS",
    authorId: "usr_012",
    content:
      "I wish I'd read this before spending two years in mainstream yoga classes that made my hypermobility worse. The distinction between 'easier versions' and 'genuinely different approaches' is so important.",
    createdAt: "2026-02-11T11:00:00Z",
  },
  {
    id: "cmt_005",
    postId: "programming-around-flares",
    parentId: null,
    authorName: "Sarah Chen",
    authorInitials: "SC",
    authorId: "usr_001",
    content:
      "The three-tier system changed everything for me. I used to feel so guilty on bad days. Now I just look at what Tier 3 says and do that. No decision fatigue, no guilt.",
    createdAt: "2026-02-06T20:30:00Z",
  },
  {
    id: "cmt_006",
    postId: "programming-around-flares",
    parentId: "cmt_005",
    authorName: "Shruti Turner",
    authorInitials: "ST",
    authorId: "admin_001",
    content:
      "This is exactly the mindset shift, Sarah. Removing the decision-making on hard days is half the battle. Really glad it's working for you.",
    createdAt: "2026-02-07T08:00:00Z",
  },
];

/* ──────────── Component ──────────── */

export function BlogComments({ postId }: BlogCommentsProps) {
  const auth = useContext(AuthContext);
  const { fmtDateTime } = useI18n();
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const isAdmin = auth?.isAdmin ?? false;
  const currentUserId = auth?.user?.id ?? "";

  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Filter comments for this post
  const postComments = useMemo(
    () => comments.filter((c) => c.postId === postId),
    [comments, postId]
  );

  // Separate top-level comments and replies
  const topLevel = useMemo(() => postComments.filter((c) => c.parentId === null), [postComments]);

  const getReplies = (commentId: string) => postComments.filter((c) => c.parentId === commentId);

  const commentCount = postComments.length;

  /* ── Actions ── */

  const handleSubmitComment = () => {
    if (!newComment.trim() || !isAuthenticated || !auth?.user) return;
    const comment: Comment = {
      id: createCommentId(),
      postId,
      parentId: null,
      authorName: `${auth.user.firstName} ${auth.user.lastName.charAt(0)}.`,
      authorInitials: auth.user.avatarInitials,
      authorId: auth.user.id,
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, comment]);
    setNewComment("");
    // In production: POST /api/blog/:slug/comments { content, parentId: null }
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyText.trim() || !isAuthenticated || !auth?.user) return;
    const reply: Comment = {
      id: createCommentId(),
      postId,
      parentId,
      authorName: `${auth.user.firstName} ${auth.user.lastName.charAt(0)}.`,
      authorInitials: auth.user.avatarInitials,
      authorId: auth.user.id,
      content: replyText.trim(),
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, reply]);
    setReplyText("");
    setReplyingTo(null);
    // In production: POST /api/blog/:slug/comments { content, parentId }
  };

  const handleDeleteComment = (commentId: string) => {
    // Delete the comment and all its replies
    setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId));
    // In production: DELETE /api/blog/:slug/comments/:id (cascades replies server-side)
  };

  const handleDeleteThread = (commentId: string) => {
    // Delete the top-level comment and all nested replies
    const replyIds = comments.filter((c) => c.parentId === commentId).map((c) => c.id);
    setComments((prev) =>
      prev.filter((c) => c.id !== commentId && !replyIds.includes(c.id) && c.parentId !== commentId)
    );
    // In production: DELETE /api/blog/:slug/comments/:id?cascade=true
  };

  /* ── Render helpers ── */

  const renderAvatar = (initials: string, isInstructor: boolean) => (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs ${
        isInstructor ? "bg-brand-accent text-brand-white" : "bg-secondary text-secondary-foreground"
      }`}
    >
      {initials}
    </div>
  );

  const renderDeleteButton = (comment: Comment, isThread: boolean) => {
    if (!isAdmin) return null;
    const hasReplies = isThread && getReplies(comment.id).length > 0;

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
                ? `This will permanently delete ${comment.authorName}'s comment and all ${getReplies(comment.id).length} ${getReplies(comment.id).length === 1 ? "reply" : "replies"}. This cannot be undone.`
                : `This will permanently delete ${comment.authorName}'s comment. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                hasReplies ? handleDeleteThread(comment.id) : handleDeleteComment(comment.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete{hasReplies ? " Thread" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isInstructor = comment.authorId === "admin_001";
    const replies = isReply ? [] : getReplies(comment.id);

    return (
      <div key={comment.id} className={isReply ? "ml-6 md:ml-10" : ""}>
        <div className="group flex gap-3 py-4">
          {isReply && (
            <CornerDownRight className="text-muted-foreground/40 mt-2.5 h-4 w-4 shrink-0" />
          )}
          {renderAvatar(comment.authorInitials, isInstructor)}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-sm ${isInstructor ? "text-brand-accent" : ""}`}>
                {comment.authorName}
              </span>
              {isInstructor && (
                <span className="bg-brand-accent/10 text-brand-accent text-micro rounded px-1.5 py-0.5">
                  Instructor
                </span>
              )}
              <span className="text-muted-foreground text-xs">
                {fmtDateTime(comment.createdAt)}
              </span>
              {renderDeleteButton(comment, !isReply)}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            {!isReply && isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground mt-1 h-7 px-2 text-xs"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              >
                <Reply className="mr-1 h-3.5 w-3.5" />
                Reply
              </Button>
            )}

            {/* Reply form */}
            {replyingTo === comment.id && (
              <div className="mt-3 space-y-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${comment.authorName}...`}
                  className="bg-input-background min-h-[80px] text-sm"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={!replyText.trim()}
                  >
                    Post Reply
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Render replies */}
        {replies.map((reply) => renderComment(reply, true))}
      </div>
    );
  };

  return (
    <section className="mt-10 border-t pt-10" aria-label="Comments">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <MessageCircle className="text-muted-foreground h-5 w-5" />
        <h3 className="text-xl">
          {commentCount === 0
            ? "Comments"
            : `${commentCount} ${commentCount === 1 ? "Comment" : "Comments"}`}
        </h3>
      </div>

      {/* New comment form */}
      {isAuthenticated ? (
        <div className="mb-8 space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="bg-input-background min-h-[100px]"
            rows={3}
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
              Post Comment
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-secondary/50 mb-8 rounded-lg p-4 text-center">
          <p className="text-muted-foreground text-sm">
            <Link href="/login" className="hover:text-primary underline">
              Log in
            </Link>{" "}
            to join the conversation.
          </p>
        </div>
      )}

      {/* Comments list */}
      {topLevel.length > 0 ? (
        <div className="divide-y">{topLevel.map((comment) => renderComment(comment))}</div>
      ) : (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No comments yet. Be the first to share your thoughts.
        </p>
      )}
    </section>
  );
}
