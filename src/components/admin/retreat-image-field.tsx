"use client";

import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRetreatCardImagePosition } from "@/lib/retreats/images";
import { ContentfulImagePicker } from "@/components/admin/contentful-image-picker";

type EventImage = {
  assetId?: string;
  url: string;
  alt: string;
  focalPoint: { x: number; y: number };
};

export function RetreatImageField({
  id,
  value,
  onChange,
  disabled = false,
}: {
  id: string;
  value?: EventImage;
  onChange: (value: EventImage) => void;
  disabled?: boolean;
}) {
  const image = value || { url: "", alt: "", focalPoint: { x: 50, y: 50 } };
  const missingAlt = Boolean(image.url.trim() && !image.alt.trim());
  return (
    <fieldset disabled={disabled} className="space-y-5">
      <legend className="sr-only">Event image and crop</legend>
      <ContentfulImagePicker
        onSelect={(asset) =>
          onChange({
            assetId: asset.assetId,
            url: asset.url,
            alt: asset.alt,
            focalPoint: { x: 50, y: 50 },
          })
        }
      />
      <details>
        <summary className="cursor-pointer text-sm underline">Use an image URL instead</summary>
        <Label htmlFor={`${id}-url`}>Main image URL</Label>
        <Input
          id={`${id}-url`}
          type="url"
          value={image.url}
          onChange={(event) => onChange({ ...image, assetId: undefined, url: event.target.value })}
        />
      </details>
      {image.url ? (
        <>
          <div>
            <Label htmlFor={`${id}-alt`}>Image description</Label>
            <Input
              id={`${id}-alt`}
              value={image.alt}
              aria-invalid={missingAlt}
              aria-describedby={`${id}-alt-help`}
              onChange={(event) => onChange({ ...image, alt: event.target.value })}
            />
            <p
              id={`${id}-alt-help`}
              className={`mt-1 text-sm ${missingAlt ? "text-destructive" : "text-muted-foreground"}`}
            >
              {missingAlt
                ? "Add a description before saving this image."
                : "Describe the photograph for someone who cannot see it."}
            </p>
          </div>
          <p className="text-muted-foreground text-sm">
            Adjust the focus to keep faces visible in different crops. The public page uses the same
            focus settings; its final crop also depends on screen size and content.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["x", "y"] as const).map((axis) => (
              <div key={axis}>
                <Label htmlFor={`${id}-${axis}`}>
                  {axis === "x" ? "Horizontal" : "Vertical"} focus: {image.focalPoint[axis]}%
                </Label>
                <Input
                  id={`${id}-${axis}`}
                  type="range"
                  min="0"
                  max="100"
                  value={image.focalPoint[axis]}
                  onChange={(event) =>
                    onChange({
                      ...image,
                      focalPoint: { ...image.focalPoint, [axis]: Number(event.target.value) },
                    })
                  }
                />
              </div>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Listing card crop", aspect: "aspect-[16/10]" },
              { label: "Tall detail crop check", aspect: "aspect-[3/4]" },
            ].map((crop) => (
              <figure key={crop.label}>
                <div className={`${crop.aspect} overflow-hidden rounded-xl border`}>
                  <ImageWithFallback
                    src={image.url}
                    alt={image.alt || "Image crop preview"}
                    className="h-full w-full object-cover"
                    style={{
                      objectPosition: getRetreatCardImagePosition(image.url, image.focalPoint),
                    }}
                  />
                </div>
                <figcaption className="text-muted-foreground mt-2 text-sm">{crop.label}</figcaption>
              </figure>
            ))}
          </div>
        </>
      ) : null}
    </fieldset>
  );
}
