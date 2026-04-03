import { renderBrandIcon } from "@/app/icon-image";

export const runtime = "nodejs";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default async function Icon() {
  return renderBrandIcon(size);
}
