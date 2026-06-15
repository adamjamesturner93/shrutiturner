import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

async function loadIconDataUrl() {
  const png = await readFile(join(process.cwd(), "public", "favicon.png"));
  return `data:image/png;base64,${Buffer.from(png).toString("base64")}`;
}

export async function renderBrandIcon({ width, height }: { width: number; height: number }) {
  const iconDataUrl = await loadIconDataUrl();

  return new ImageResponse(
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
    </div>,
    {
      width,
      height,
    }
  );
}
