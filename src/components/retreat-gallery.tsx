"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Expand } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type GalleryImage = {
  url: string;
  alt: string;
  caption?: string;
  focalPoint?: { x: number; y: number };
};

export function RetreatGallery({ images }: { images: GalleryImage[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const image = selected === null ? null : images[selected];
  const move = (direction: number) =>
    setSelected((current) =>
      current === null ? null : (current + direction + images.length) % images.length
    );
  if (!images.length) return null;
  return (
    <section aria-labelledby="retreat-gallery-heading" className="space-y-6">
      <h2 id="retreat-gallery-heading" className="text-3xl md:text-4xl">
        A closer look
      </h2>
      <p className="text-muted-foreground">Select a photo to take a closer look.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {images.map((item, index) => (
          <button
            key={`${item.url}-${index}`}
            type="button"
            aria-label={`Enlarge photo ${index + 1}: ${item.alt}`}
            aria-haspopup="dialog"
            className="group focus-visible:outline-brand-accent relative overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4"
            onClick={(event) => {
              opener.current = event.currentTarget;
              setSelected(index);
            }}
          >
            <ImageWithFallback
              src={item.url}
              alt={item.alt}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
              style={{
                objectPosition: `${item.focalPoint?.x ?? 50}% ${item.focalPoint?.y ?? 50}%`,
              }}
            />
            <span className="bg-background text-foreground absolute right-3 bottom-3 rounded-full p-3 shadow">
              <Expand aria-hidden="true" className="h-5 w-5" />
            </span>
          </button>
        ))}
      </div>
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent
          className="max-h-[90dvh] overflow-y-auto p-4 pt-12 sm:max-w-5xl sm:p-6 sm:pt-12"
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              move(1);
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              move(-1);
            }
          }}
        >
          <DialogTitle className="sr-only">
            A closer look — photo {(selected ?? 0) + 1} of {images.length}
          </DialogTitle>
          {image && (
            <figure className="min-w-0 space-y-4">
              <ImageWithFallback
                key={selected}
                src={image.url}
                alt={image.alt}
                sizes="(max-width: 768px) 100vw, 1000px"
                className="max-h-[60dvh] w-full object-contain"
              />
              {image.caption && (
                <figcaption className="text-center text-sm sm:text-base">
                  {image.caption}
                </figcaption>
              )}
            </figure>
          )}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              disabled={images.length < 2}
              aria-label="Previous photo"
              onClick={() => move(-1)}
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <span className="text-sm" aria-live="polite" aria-atomic="true">
              Photo {(selected ?? 0) + 1} of {images.length}
            </span>
            <Button
              variant="outline"
              disabled={images.length < 2}
              aria-label="Next photo"
              onClick={() => move(1)}
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
