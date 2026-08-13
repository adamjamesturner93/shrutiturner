export type StructuredTextBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] };

function normalizeLines(value: string) {
  return value.replace(/\r\n?/g, "\n").split("\n");
}

export function parseLegalDocumentBody(value: string): StructuredTextBlock[] {
  const blocks: StructuredTextBlock[] = [];
  const paragraph: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() });
      paragraph.length = 0;
    }
  };
  const flushList = () => {
    if (listItems.length) {
      blocks.push({ type: "unordered-list", items: listItems });
      listItems = [];
    }
  };

  for (const rawLine of normalizeLines(value)) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const numberedHeading = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberedHeading) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: 2,
        text: `${numberedHeading[1]}. ${numberedHeading[2]}`,
      });
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      listItems.push(bullet[1]);
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

function normalizeComparableTitle(value: string) {
  return value
    .replace(/^#+\s*/, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

export function parseBlogPostBody(value: string, pageTitle: string): StructuredTextBlock[] {
  const blocks: StructuredTextBlock[] = [];
  const lines = normalizeLines(value);
  const paragraph: string[] = [];
  let listType: "unordered-list" | "ordered-list" | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() });
      paragraph.length = 0;
    }
  };
  const flushList = () => {
    if (listType && listItems.length) {
      blocks.push({ type: listType, items: listItems });
    }
    listType = null;
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const text = heading[2].trim();
      if (
        heading[1].length === 1 &&
        normalizeComparableTitle(text) === normalizeComparableTitle(pageTitle)
      ) {
        continue;
      }
      blocks.push({ type: "heading", level: heading[1].length >= 3 ? 3 : 2, text });
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const nextType = unordered ? "unordered-list" : "ordered-list";
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      listItems.push((unordered || ordered)?.[1] || "");
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}
