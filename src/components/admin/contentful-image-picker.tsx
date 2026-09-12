"use client";

import { useEffect, useState } from "react";
import { Images, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

type ImageAsset = { assetId: string; url: string; title: string; alt: string };
type Library = {
  items: ImageAsset[];
  page: number;
  hasMore: boolean;
  libraryUrl: string;
  environment: string;
};

export function ContentfulImagePicker({ onSelect }: { onSelect: (image: ImageAsset) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [library, setLibrary] = useState<Library | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const response = await fetch(
          `/api/admin/media/images?q=${encodeURIComponent(query)}&page=${page}`,
          { cache: "no-store", signal: controller.signal }
        );
        const payload = (await response.json()) as { data?: Library; error?: { message?: string } };
        if (!response.ok || !payload.data)
          throw new Error(payload.error?.message || "Could not load images.");
        if (!controller.signal.aborted) setLibrary(payload.data);
      } catch (error) {
        if (!controller.signal.aborted)
          setError(error instanceof Error ? error.message : "Could not load images.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [open, query, page, refresh]);
  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Images aria-hidden="true" />
        Choose image from library
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Choose an image</DialogTitle>
            <DialogDescription>
              Upload and publish new images in Contentful, then refresh this library. Selecting an
              image does not publish your event page.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a
                href={library?.libraryUrl || "https://app.contentful.com"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink aria-hidden="true" />
                Upload in Contentful{library ? ` · ${library.environment}` : ""}
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setRefresh((value) => value + 1)}
            >
              <RefreshCw aria-hidden="true" />
              Refresh images
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              aria-label="Search images"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  setPage(1);
                  setQuery(search.trim());
                }
              }}
            />
            <Button
              type="button"
              onClick={() => {
                setPage(1);
                setQuery(search.trim());
              }}
            >
              Search
            </Button>
          </div>
          {error ? <p role="alert">{error}</p> : null}
          {loading ? <p role="status">Loading images…</p> : null}
          {!loading && !error && library ? (
            <>
              {!library.items.length ? (
                <p>
                  No published images match. Publish an image in Contentful and refresh, or try
                  another search.
                </p>
              ) : null}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {library.items.map((image) => (
                  <button
                    type="button"
                    key={image.assetId}
                    className="overflow-hidden rounded-lg border text-left focus-visible:outline-2 focus-visible:outline-offset-2"
                    onClick={() => {
                      onSelect(image);
                      setOpen(false);
                    }}
                  >
                    <ImageWithFallback
                      src={image.url}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <span className="block p-2 text-sm">{image.title}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Previous
                </Button>
                <span>Page {page}</span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!library.hasMore}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
