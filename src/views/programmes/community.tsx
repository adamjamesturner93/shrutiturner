"use client";
import { DelayedProgrammeLoading } from "./loading";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useProgrammeData, programmeRequest, panelClass } from "./shared";
import { ProgrammeReplay } from "./portal";
import type { listProgrammePosts } from "@/lib/programmes/community-service";
import { MessageCircle } from "lucide-react";
import { eyebrow } from "./visuals";
type Community = Awaited<ReturnType<typeof listProgrammePosts>>;
export function ProgrammeCommunity({ id, preview = false }: { id: string; preview?: boolean }) {
  const endpoint = `/api/me/programmes/${id}/community`;
  const { data, error, reload } = useProgrammeData<Community>(
    `${endpoint}?limit=${preview ? 3 : 20}`
  );
  const [additional, setAdditional] = useState<Community["posts"]>([]);
  const [nextCursor, setNextCursor] = useState<string | null | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const allPosts = [
    ...new Map([...(data?.posts || []), ...additional].map((post) => [post.id, post])).values(),
  ];
  const cursor = nextCursor === undefined ? data?.nextCursor : nextCursor;
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(url: string, body: unknown) {
    if (saving) return false;
    setSaving(true);
    try {
      await programmeRequest(url, body);
      setMessage("Saved");
      setAdditional([]);
      setNextCursor(undefined);
      reload();
      return true;
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save");
      return false;
    } finally {
      setSaving(false);
    }
  }
  const posts = preview
    ? allPosts.filter((p) => !p.parentId).slice(-3)
    : allPosts.filter((p) => !p.parentId);
  return (
    <section className="space-y-4" aria-label="Community discussions">
      {!preview && (
        <header className="space-y-2">
          <p className={eyebrow}>Your cohort</p>
          <h2 className="text-3xl">Community</h2>
          <p className="text-muted-foreground">
            Ask a question, share what you are learning, or join this week's reflection.
          </p>
        </header>
      )}
      {!data && !error && <DelayedProgrammeLoading label="Loading discussions" kind="community" />}
      {data && !posts?.length && (
        <div className="bg-secondary rounded-2xl p-6">
          <MessageCircle aria-hidden="true" className="text-primary mb-3 h-7 w-7" />
          <p>No conversations yet. You are welcome to start one.</p>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {!preview && (
        <form
          className={panelClass}
          onSubmit={async (event) => {
            event.preventDefault();
            const element = event.currentTarget;
            const form = new FormData(element);
            const saved = await submit(endpoint, {
              title: form.get("title"),
              body: form.get("body"),
              resourceIds: form.getAll("resourceIds"),
            });
            if (saved) element.reset();
          }}
        >
          <h2>Ask a question or share a reflection</h2>
          <label className="block">
            Post title
            <input name="title" className="mt-1 block w-full rounded border p-2" maxLength={160} />
          </label>
          <label className="block">
            Your post
            <textarea
              name="body"
              required
              maxLength={10000}
              className="mt-1 block w-full rounded border p-2"
            />
          </label>
          {data?.staff && data.resources.length > 0 && (
            <fieldset>
              <legend>Include a coach recording</legend>
              {data.resources.map((r) => (
                <label className="block" key={r.id}>
                  <input type="checkbox" name="resourceIds" value={r.id} /> {r.title}
                </label>
              ))}
            </fieldset>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Post to community"}
          </Button>
        </form>
      )}
      {posts?.map((p) => (
        <article key={p.id} className={panelClass}>
          <h3>
            {p.pinned ? "Pinned: " : ""}
            {p.title}
          </h3>
          <p className="text-sm">
            {p.author}
            {p.locked ? " · Replies closed" : ""}
          </p>
          <p className="whitespace-pre-wrap">
            {p.body
              .split(/(\/dashboard\/programmes\/[a-zA-Z0-9_-]+\/weeks\/[a-zA-Z0-9_-]+)/g)
              .map((part, i) =>
                part.startsWith("/dashboard/programmes/") ? (
                  <Link className="underline" href={part} key={i}>
                    Open this week's theme
                  </Link>
                ) : (
                  part
                )
              )}
          </p>
          {p.resourceIds.map((resource) => (
            <ProgrammeReplay id={id} replayId={resource} key={resource} />
          ))}
          {!preview && (
            <>
              {allPosts
                .filter((r) => r.parentId === p.id)
                .map((r) => (
                  <div key={r.id} className="ml-4 border-l pl-3">
                    <p className="text-sm">{r.author}</p>
                    <p>{r.body}</p>
                    {(r.own || data.staff) && !r.deleted && (
                      <details>
                        <summary>Edit reply</summary>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            void submit(`${endpoint}/${r.id}`, {
                              action: "edit",
                              body: new FormData(e.currentTarget).get("body"),
                            });
                          }}
                        >
                          <label>
                            Updated reply
                            <textarea
                              className="block w-full rounded border p-2"
                              name="body"
                              defaultValue={r.body}
                              required
                            />
                          </label>
                          <Button type="submit">Save reply</Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => submit(`${endpoint}/${r.id}`, { action: "delete" })}
                          >
                            Delete reply
                          </Button>
                        </form>
                      </details>
                    )}
                  </div>
                ))}
              {(p.own || data?.staff) && !p.deleted && (
                <details>
                  <summary>Edit post</summary>
                  <form
                    className="space-y-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void submit(`${endpoint}/${p.id}`, {
                        action: "edit",
                        body: new FormData(e.currentTarget).get("body"),
                      });
                    }}
                  >
                    <label>
                      Updated post
                      <textarea
                        name="body"
                        defaultValue={p.body}
                        required
                        className="block w-full rounded border p-2"
                      />
                    </label>
                    <Button type="submit">Save post</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => submit(`${endpoint}/${p.id}`, { action: "delete" })}
                    >
                      Delete post
                    </Button>
                  </form>
                </details>
              )}
              {data?.staff && !p.deleted && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      submit(`${endpoint}/${p.id}`, { action: "announce", value: !p.announcement })
                    }
                  >
                    {p.announcement ? "Remove announcement" : "Announce"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      submit(`${endpoint}/${p.id}`, { action: "pin", value: !p.pinned })
                    }
                  >
                    {p.pinned ? "Unpin" : "Pin"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      submit(`${endpoint}/${p.id}`, { action: "lock", value: !p.locked })
                    }
                  >
                    {p.locked ? "Unlock" : "Lock"}
                  </Button>
                </div>
              )}
              {!p.deleted && (!p.locked || data?.staff) && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const element = e.currentTarget;
                    const saved = await submit(endpoint, {
                      parentId: p.id,
                      body: new FormData(element).get("reply"),
                    });
                    if (saved) element.reset();
                  }}
                >
                  <label>
                    Reply to {p.title}
                    <textarea
                      name="reply"
                      required
                      className="my-2 block w-full rounded border p-2"
                    />
                  </label>
                  <Button type="submit" variant="outline" disabled={saving}>
                    Reply
                  </Button>
                </form>
              )}
            </>
          )}
        </article>
      ))}
      {!preview && cursor && (
        <Button
          variant="outline"
          disabled={loadingMore}
          onClick={async () => {
            setLoadingMore(true);
            try {
              const page = await programmeRequest<Community>(
                `${endpoint}?limit=20&cursor=${encodeURIComponent(cursor)}`
              );
              setAdditional((current) => [...current, ...page.posts]);
              setNextCursor(page.nextCursor);
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Unable to load conversations");
            } finally {
              setLoadingMore(false);
            }
          }}
        >
          {loadingMore ? "Loading conversations…" : "Load more conversations"}
        </Button>
      )}
      {preview && (
        <Link className="underline" href={`/dashboard/programmes/${id}/community`}>
          Open community
        </Link>
      )}
    </section>
  );
}
