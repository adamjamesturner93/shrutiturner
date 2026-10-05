"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TestimonialContent } from "@/lib/content/types";

export function TestimonialPicker({
  available,
  selected,
  onChange,
}: {
  available: TestimonialContent[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const move = (index: number, direction: number) => {
    const next = [...selected];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(next);
  };
  return (
    <section className="space-y-4" aria-label="Event testimonials">
      <h3 className="text-xl">Testimonials</h3>
      <p className="text-muted-foreground text-sm">
        Choose up to three published quotes approved for event pages in Contentful. Your chosen
        order appears after What’s included.
      </p>
      <ol className="space-y-3">
        {selected.map((id, index) => {
          const quote = available.find((item) => item.id === id);
          return (
            <li key={id} className="space-y-2 rounded-lg border p-3">
              <p>
                {quote
                  ? `“${quote.quote}”`
                  : "This quote is unavailable or no longer approved. It will not appear publicly."}
              </p>
              {quote ? (
                <p className="text-sm">
                  {quote.authorName} {quote.contextLabel ? `· ${quote.contextLabel}` : ""}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`Move testimonial ${index + 1} up`}
                >
                  Move up
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={index === selected.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Move testimonial ${index + 1} down`}
                >
                  Move down
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onChange(selected.filter((value) => value !== id))}
                >
                  Remove testimonial {index + 1}
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
      <Label htmlFor="testimonial-search">Search quotes or authors</Label>
      <Input
        id="testimonial-search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="max-h-80 space-y-3 overflow-y-auto">
        {available
          .filter(
            (item) =>
              !selected.includes(item.id) &&
              `${item.quote} ${item.authorName} ${item.contextLabel || ""}`
                .toLowerCase()
                .includes(search.toLowerCase())
          )
          .map((item) => (
            <div key={item.id} className="space-y-2 rounded-lg border p-3">
              <blockquote>{item.quote}</blockquote>
              <p className="text-sm">
                {item.authorName}
                {item.contextLabel ? ` · ${item.contextLabel}` : ""}
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={selected.length >= 3}
                onClick={() => onChange([...selected, item.id])}
                aria-label={`Add testimonial by ${item.authorName}`}
              >
                Add quote
              </Button>
            </div>
          ))}
      </div>
      {!available.length ? (
        <p className="text-muted-foreground">
          No published testimonials are approved for event pages yet.
        </p>
      ) : null}
    </section>
  );
}
