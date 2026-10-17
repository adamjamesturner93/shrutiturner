import { CircleCheck } from "lucide-react";
import { renderInlineMarkdown } from "@/lib/blog/inline-markdown";
import { parseBlogPostBody } from "@/lib/content/structured-text";
import { cn } from "@/components/ui/utils";

export function MarkdownContent({
  children,
  className,
  activityList = false,
}: {
  children: string;
  className?: string;
  activityList?: boolean;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {parseBlogPostBody(children, "", true).map((block, index) => {
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
                activityList ? "list-none space-y-4" : "space-y-2 pl-6",
                !activityList && (block.type === "ordered-list" ? "list-decimal" : "list-disc")
              )}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className={activityList ? "flex items-start gap-3" : undefined}>
                  {activityList && (
                    <CircleCheck
                      aria-hidden="true"
                      className="text-brand-accent mt-1 h-5 w-5 shrink-0"
                    />
                  )}
                  {activityList ? (
                    <span>{renderInlineMarkdown(item)}</span>
                  ) : (
                    renderInlineMarkdown(item)
                  )}
                </li>
              ))}
            </List>
          );
        }
        return (
          <p key={index} className="whitespace-pre-line">
            {renderInlineMarkdown(block.text)}
          </p>
        );
      })}
    </div>
  );
}
