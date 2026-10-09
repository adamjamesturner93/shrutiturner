"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { fitGallery } from "@/lib/daily/gallery-layout";

export function ResponsiveGallery({ children }: { children: ReactNode[] }) {
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 640, height: 360 });
  const [page, setPage] = useState(0);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const layout = fitGallery(size.width, Math.max(90, size.height - 44), children.length);
  const pages = Math.max(1, Math.ceil(children.length / layout.pageSize));
  const currentPage = Math.min(page, pages - 1);
  return (
    <div
      ref={container}
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      aria-label="Workshop participants"
    >
      <div
        className="grid flex-1 content-center justify-center gap-3"
        style={{
          gridTemplateColumns: `repeat(${layout.columns}, ${layout.tileWidth}px)`,
          gridAutoRows: `${layout.tileHeight}px`,
        }}
      >
        {children.slice(currentPage * layout.pageSize, (currentPage + 1) * layout.pageSize)}
      </div>
      {pages > 1 && (
        <nav
          aria-label="Participant gallery pages"
          className="flex h-11 shrink-0 items-center justify-center gap-3 text-sm text-white"
        >
          <button
            className="rounded border border-white/40 px-3 py-1 focus-visible:outline-2 disabled:opacity-50"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous
          </button>
          <span aria-live="polite">
            Page {currentPage + 1} of {pages}
          </span>
          <button
            className="rounded border border-white/40 px-3 py-1 focus-visible:outline-2 disabled:opacity-50"
            disabled={currentPage === pages - 1}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
