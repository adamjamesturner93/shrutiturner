/** Parse a Markdown destination separately from its optional title. Never repair stored URLs by guessing. */
export function parseMarkdownLinkDestination(
  value: string
): { href: string; title?: string } | null {
  const match = value
    .trim()
    .match(/^(?:<([^<>\s]+)>|([^\s<>"']+?))(?:\s+(?:"([^"\n]*)"|'([^'\n]*)'|\(([^()\n]*)\)))?$/);
  if (!match) return null;
  const href = match[1] || match[2];
  if (/[\u0000-\u0020\u007f\\]/.test(href)) return null;
  if (!/^(?:https?:\/\/|mailto:|\/(?!\/)|#)/i.test(href)) return null;
  return { href, title: match[3] ?? match[4] ?? match[5] };
}
