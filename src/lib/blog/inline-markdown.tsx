import { parseMarkdownLinkDestination } from "@/lib/content/markdown-link";
import type { ReactNode } from "react";

const INLINE_MARKDOWN_PATTERN =
  /(\[([^\]]+)\]\(((?:[^()]|\([^()]*\))*)\))|(\*\*([^*]+)\*\*)|(__([^_]+)__)|(`([^`]+)`)|(\*([^*]+)\*)|(_([^_]+)_)/g;

export function renderInlineMarkdown(input: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of input.matchAll(INLINE_MARKDOWN_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push(input.slice(lastIndex, index));
    }

    const destination = match[3] ? parseMarkdownLinkDestination(match[3]) : null;
    const linkText = match[2];
    const strongText = match[5] || match[7];
    const codeText = match[9];
    const emphasisText = match[11] || match[13];
    const key = `${index}-${match[0]}`;

    if (linkText && destination) {
      nodes.push(
        <a
          key={key}
          href={destination.href}
          title={destination.title}
          className="text-primary underline underline-offset-4"
        >
          {linkText}
        </a>
      );
    } else if (linkText) {
      nodes.push(linkText);
    } else if (strongText) {
      nodes.push(<strong key={key}>{strongText}</strong>);
    } else if (codeText) {
      nodes.push(
        <code key={key} className="bg-muted rounded px-1 py-0.5 text-sm">
          {codeText}
        </code>
      );
    } else if (emphasisText) {
      nodes.push(<em key={key}>{emphasisText}</em>);
    } else {
      nodes.push(match[0]);
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < input.length) {
    nodes.push(input.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [input];
}
