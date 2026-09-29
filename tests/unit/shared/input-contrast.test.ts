import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
function luminance(hex: string) {
  const rgb = hex.match(/[a-f\d]{2}/gi)!.map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
it("keeps the light input boundary distinguishable from field and page backgrounds", () => {
  const css = readFileSync("src/styles/theme.css", "utf8");
  const border = css.match(/--input: (#[a-f\d]+);/)![1];
  for (const background of ["#f3f3f1", "#ffffff", "#fafaf8"]) {
    expect((luminance(background) + 0.05) / (luminance(border) + 0.05)).toBeGreaterThanOrEqual(3);
  }
});
