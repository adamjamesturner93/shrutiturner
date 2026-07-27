import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

type ImageWithFallbackProps = Omit<ImageProps, "src" | "alt" | "width" | "height" | "onError"> & {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
};

const OPTIMIZED_REMOTE_HOSTS = new Set([
  "images.ctfassets.net",
  "images.contentful.com",
  "images.unsplash.com",
]);

function canUseNextImage(src: string) {
  if (src.startsWith("/") || src.startsWith("data:")) return true;
  try {
    return OPTIMIZED_REMOTE_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

export function ImageWithFallback({
  src = "",
  alt = "",
  style,
  className,
  width = 1600,
  height = 1200,
  sizes = "(max-width: 768px) 100vw, 50vw",
  ...rest
}: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false);

  const handleError = () => {
    setDidError(true);
  };

  if (didError) {
    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle ${className ?? ""}`}
        style={style}
      >
        <div className="flex h-full w-full items-center justify-center">
          <Image
            src={ERROR_IMG_SRC}
            alt="Unable to load"
            width={88}
            height={88}
            unoptimized
            data-original-url={src}
          />
        </div>
      </div>
    );
  }

  if (!canUseNextImage(src)) {
    return (
      // Contentful also permits an arbitrary external image URL. Keep that fallback functional
      // without widening Next's optimized-image allowlist to every host.
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        loading={rest.loading === "eager" ? "eager" : "lazy"}
        onError={handleError}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      style={style}
      width={width}
      height={height}
      sizes={sizes}
      {...rest}
      onError={handleError}
    />
  );
}
