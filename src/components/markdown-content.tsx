import { renderInlineMarkdown } from "@/lib/blog/inline-markdown";
import { parseBlogPostBody } from "@/lib/content/structured-text";
import { cn } from "@/components/ui/utils";

export function MarkdownContent({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {parseBlogPostBody(children, "").map((block, index) => {
        if (block.type === "heading") {
          const Heading = block.level === 3 ? "h3" : "h2";
          return (
            <Heading key={index} className="text-2xl">
              {renderInlineMarkdown(block.text)}
            </Heading>
          );
        }
        if (block.type === "unordered-list" || block.type === "ordered-list") {
          const List = block.type === "ordered-list" ? "ol" : "ul";
          return (
            <List
              key={index}
              className={cn(
                "space-y-2 pl-6",
                block.type === "ordered-list" ? "list-decimal" : "list-disc"
              )}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
              ))}
            </List>
          );
        }
        return <p key={index}>{renderInlineMarkdown(block.text)}</p>;
      })}
    </div>
  );
}
