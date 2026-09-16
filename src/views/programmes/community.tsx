"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useProgrammeData, programmeRequest, panelClass } from "./shared";
import { ProgrammeReplay } from "./portal";
import type { listProgrammePosts } from "@/lib/programmes/community-service";
type Community = Awaited<ReturnType<typeof listProgrammePosts>>;
export function ProgrammeCommunity({ id, preview = false }: { id: string; preview?: boolean }) {
  const endpoint = `/api/me/programmes/${id}/community`;
  const { data, error, reload } = useProgrammeData<Community>(endpoint);
  const [message, setMessage] = useState("");
  async function submit(url: string, body: unknown) {
    try {
      await programmeRequest(url, body);
      setMessage("Saved");
      reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save");
    }
  }
  const posts = preview
    ? data?.posts.filter((p) => !p.parentId).slice(-3)
    : data?.posts.filter((p) => !p.parentId);
  return (
    <section className="space-y-4" aria-label="Community discussions">
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {!preview && (
        <form
          className={panelClass}
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void submit(endpoint, {
              title: form.get("title"),
              body: form.get("body"),
              resourceIds: form.getAll("resourceIds"),
            });
            event.currentTarget.reset();
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
          <Button type="submit">Post to community</Button>
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
              {data?.posts
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
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submit(endpoint, {
                      parentId: p.id,
                      body: new FormData(e.currentTarget).get("reply"),
                    });
                    e.currentTarget.reset();
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
                  <Button type="submit" variant="outline">
                    Reply
                  </Button>
                </form>
              )}
            </>
          )}
        </article>
      ))}
      {preview && (
        <Link className="underline" href={`/dashboard/programmes/${id}/community`}>
          Open community
        </Link>
      )}
    </section>
  );
}
