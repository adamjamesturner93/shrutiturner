import { renderBrandIcon } from "@/app/icon-image";

export const runtime = "nodejs";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default async function AppleIcon() {
  return renderBrandIcon(size);
}
