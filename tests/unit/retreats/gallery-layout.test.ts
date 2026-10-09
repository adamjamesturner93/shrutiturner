import { expect, it } from "vitest";
import { fitGallery } from "@/lib/daily/gallery-layout";
it.each([1, 2, 3, 4, 5, 6, 30])("fits %i participants inside the visible area", (count) => {
  for (const [width, height] of [
    [1000, 500],
    [600, 280],
    [360, 500],
  ]) {
    const layout = fitGallery(width, height, count);
    const rows = Math.ceil(layout.pageSize / layout.columns);
    expect(layout.columns * layout.tileWidth + (layout.columns - 1) * 12).toBeLessThanOrEqual(
      width + 0.01
    );
    expect(rows * layout.tileHeight + (rows - 1) * 12).toBeLessThanOrEqual(height + 0.01);
    expect(layout.tileWidth / layout.tileHeight).toBeCloseTo(16 / 9);
  }
});
