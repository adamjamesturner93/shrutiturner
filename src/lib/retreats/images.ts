import type { RetreatCombinedContent } from "@/lib/content/types";

function isRenderableImageSource(value: string) {
  return value.startsWith("/") || value.startsWith("https://") || value.startsWith("http://");
}

export function getRetreatImageSrc(input: {
  imageUrl?: string | null;
  retreatType?: "in_person" | "online" | null;
}) {
  const imageUrl = input.imageUrl?.trim();
  if (imageUrl && isRenderableImageSource(imageUrl)) {
    return imageUrl;
  }

  return input.retreatType === "online" ? "/images/shruti.jpeg" : "/images/shruti-coaching.jpeg";
}

export function getRetreatCardImageSrc(retreat: RetreatCombinedContent) {
  return getRetreatImageSrc({
    imageUrl: retreat.imageUrl,
    retreatType: retreat.dates[0]?.retreatType || null,
  });
}

export function getRetreatCardImagePosition(
  imageUrl: string,
  focalPoint?: { x: number; y: number } | null
) {
  if (focalPoint) {
    return `${Math.min(Math.max(focalPoint.x, 0), 100)}% ${Math.min(Math.max(focalPoint.y, 0), 100)}%`;
  }
  const path = imageUrl.split("?")[0];
  if (path === "/images/shruti-hiking-selfie.jpeg") return "50% 68%";
  if (path === "/images/shruti-coaching.jpeg") return "50% 0%";
  return "50% 50%";
}
