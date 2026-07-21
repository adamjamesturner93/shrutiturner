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
