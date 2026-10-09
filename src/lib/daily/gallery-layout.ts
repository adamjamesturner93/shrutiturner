export function fitGallery(width: number, height: number, count: number) {
  const gap = 12;
  const capacity = Math.max(1, Math.floor((width + gap) / 172) * Math.floor((height + gap) / 102));
  const pageSize = Math.max(1, Math.min(count, capacity));
  let best = { columns: 1, tileWidth: 0, tileHeight: 0, pageSize };
  for (let columns = 1; columns <= pageSize; columns++) {
    const rows = Math.ceil(pageSize / columns);
    const tileWidth = Math.max(
      0,
      Math.min(
        (width - gap * (columns - 1)) / columns,
        (((height - gap * (rows - 1)) / rows) * 16) / 9
      )
    );
    if (tileWidth > best.tileWidth)
      best = { columns, tileWidth, tileHeight: (tileWidth * 9) / 16, pageSize };
  }
  return best;
}
