"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TestimonialContent } from "@/lib/content/types";

export function TestimonialQuotes({
  testimonials,
  title = "What it’s like to join me",
}: {
  testimonials: TestimonialContent[];
  title?: string;
}) {
  const id = useId();
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const quotes = testimonials.filter(
    (quote, index, all) =>
      quote.quote.trim() && all.findIndex((item) => item.id === quote.id) === index
  );
  const move = (direction: number) => {
    const node = track.current;
    if (!node) return;
    const card = node.firstElementChild as HTMLElement | null;
    const distance = (card?.offsetWidth || node.clientWidth) + 20;
    const end = node.scrollWidth - node.clientWidth;
    const next =
      direction > 0 && node.scrollLeft >= end - 2
        ? 0
        : direction < 0 && node.scrollLeft <= 0
          ? end
          : node.scrollLeft + direction * distance;
    node.scrollTo({ left: next, behavior: reducedMotion ? "instant" : "smooth" });
  };
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (paused || interacting || reducedMotion || quotes.length < 2) return;
    let frame = 0;
    let previous = 0;
    let position = track.current?.scrollLeft || 0;
    const animate = (time: number) => {
      const node = track.current;
      const elapsed = previous ? Math.min(time - previous, 64) : 0;
      previous = time;
      if (
        node &&
        !document.hidden &&
        node.getBoundingClientRect().bottom > 0 &&
        node.getBoundingClientRect().top < window.innerHeight
      ) {
        const repeat = node.querySelector<HTMLElement>("[data-review-repeat]");
        const first = node.firstElementChild as HTMLElement | null;
        const cycle = repeat && first ? repeat.offsetLeft - first.offsetLeft : 0;
        if (cycle > 0) {
          position = (position + elapsed * 0.024) % cycle;
          node.scrollLeft = position;
        }
      }
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [paused, interacting, reducedMotion, quotes.length]);
  if (!quotes.length) return null;
  return (
    <section
      aria-labelledby={id}
      className="space-y-6"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-brand-accent mb-2 text-sm">In their own words</p>
          <h2 id={id} className="text-3xl">
            {title}
          </h2>
        </div>
        {quotes.length > 1 ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Previous review"
              onClick={() => {
                setPaused(true);
                move(-1);
              }}
            >
              <ArrowLeft />
            </Button>
            {!reducedMotion ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={paused ? "Play reviews" : "Pause reviews"}
                onClick={() => setPaused(!paused)}
              >
                {paused ? <Play /> : <Pause />}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Next review"
              onClick={() => {
                setPaused(true);
                move(1);
              }}
            >
              <ArrowRight />
            </Button>
          </div>
        ) : null}
      </div>
      <div
        ref={track}
        tabIndex={quotes.length > 1 ? 0 : undefined}
        role="region"
        aria-label="Guest reviews"
        onTouchStart={() => setPaused(true)}
        onWheel={() => setPaused(true)}
        className="focus-visible:outline-brand-accent relative flex gap-5 overflow-x-auto rounded-2xl px-6 pb-4 focus-visible:outline-2 md:px-10"
        style={
          quotes.length > 1
            ? {
                maskImage:
                  "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
              }
            : undefined
        }
      >
        {(quotes.length > 1 && !reducedMotion ? [...quotes, ...quotes] : quotes).map(
          (item, index) => (
            <figure
              key={`${item.id}-${index}`}
              aria-hidden={index >= quotes.length ? true : undefined}
              data-review-repeat={index === quotes.length ? "true" : undefined}
              className={`border-brand-accent/15 flex shrink-0 flex-col rounded-[1.75rem] border bg-white p-7 shadow-sm md:p-8 ${quotes.length > 2 ? "w-[85%] md:w-[calc(40%-12px)]" : quotes.length === 2 ? "w-[85%] md:w-[calc(50%-10px)]" : "w-full"}`}
            >
              <Quote aria-hidden="true" className="text-brand-accent/30 mb-4 ml-auto h-10 w-10" />
              <blockquote className="text-lg leading-relaxed md:text-xl">“{item.quote}”</blockquote>
              <figcaption className="mt-auto pt-7">
                <span className="text-lg font-semibold">{item.authorName}</span>
                {item.contextLabel ? (
                  <span className="text-muted-foreground mt-1 block text-sm">
                    {item.contextLabel}
                  </span>
                ) : null}
              </figcaption>
            </figure>
          )
        )}
      </div>
    </section>
  );
}
