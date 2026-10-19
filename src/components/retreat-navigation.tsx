"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import type { RetreatNavigationItem } from "@/lib/retreats/navigation";

export function RetreatNavigation({ mobile = false }: { mobile?: boolean }) {
  const panel = useRef<HTMLDetailsElement>(null);
  const [items, setItems] = useState<RetreatNavigationItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const item = items[selected] || items[0];
  const close = () => {
    if (panel.current) panel.current.open = false;
  };
  async function load() {
    if (!panel.current?.open || loaded || loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/retreats/navigation");
      if (response.ok) {
        const data: { items: RetreatNavigationItem[] } = await response.json();
        setItems(data.items);
        setLoaded(true);
      }
    } catch {
      /* The catalogue link remains available if previews cannot load. */
    } finally {
      setLoading(false);
    }
  }
  return (
    <details
      ref={panel}
      onToggle={load}
      className={mobile ? "rounded-md" : "relative"}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          close();
          panel.current?.querySelector("summary")?.focus();
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
    >
      <summary
        className={`hover:text-primary flex min-h-11 cursor-pointer list-none items-center gap-2 ${mobile ? "px-3 py-2" : "py-2"}`}
      >
        Retreats &amp; Workshops
        <ChevronDown aria-hidden="true" className="h-4 w-4" />
      </summary>
      <div
        className={
          mobile
            ? "space-y-2 px-1 pb-3"
            : "bg-background absolute top-full right-0 z-50 grid w-[min(48rem,90vw)] grid-cols-[0.85fr_1.15fr] gap-5 rounded-3xl border p-5 shadow-xl"
        }
      >
        {!mobile && item ? (
          <Link
            href={`/retreats/${item.slug}`}
            onClick={close}
            className="bg-brand-warm relative flex min-h-72 flex-col justify-end overflow-hidden rounded-2xl"
          >
            {item.imageUrl ? (
              <ImageWithFallback
                src={item.imageUrl}
                alt={item.imageAlt}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div className="relative bg-black/70 p-5 text-white">
              <p className="text-sm">{item.location}</p>
              <p className="mt-1 text-xl">{item.title}</p>
              <p className="mt-2 text-sm">{item.date}</p>
            </div>
          </Link>
        ) : null}
        <div className="min-w-0 space-y-2">
          {loading ? (
            <p role="status" className="text-muted-foreground p-3 text-sm">
              Loading upcoming experiences…
            </p>
          ) : null}
          {items.map((entry, index) => (
            <Link
              key={entry.slug}
              href={`/retreats/${entry.slug}`}
              onClick={close}
              onMouseEnter={() => setSelected(index)}
              onFocus={() => setSelected(index)}
              className="hover:bg-secondary focus-visible:bg-secondary flex gap-3 rounded-xl p-3"
            >
              {mobile && entry.imageUrl ? (
                <ImageWithFallback
                  src={entry.imageUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
              ) : null}
              <div className="min-w-0 break-words">
                <p className="leading-snug font-medium">{entry.title}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {entry.format} · {entry.date}
                </p>
                <p className="text-muted-foreground text-sm">
                  {entry.location} · {entry.status}
                </p>
              </div>
            </Link>
          ))}
          <Link
            href="/retreats"
            onClick={close}
            className="bg-secondary text-primary block rounded-xl p-4 text-center font-medium"
          >
            View all retreats &amp; workshops
          </Link>
        </div>
      </div>
    </details>
  );
}
