import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

async function loadIconDataUrl() {
  const svg = await readFile(join(process.cwd(), "public", "icon.svg"), "utf8");
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export async function renderBrandIcon({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const iconDataUrl = await loadIconDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <div
          style={{
            width: "82%",
            height: "82%",
            backgroundImage: `url(${iconDataUrl})`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "contain",
          }}
        />
      </div>
    ),
    {
      width,
      height,
    }
  );
}
