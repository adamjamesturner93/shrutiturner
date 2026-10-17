import { ChevronDown } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import { splitScheduleSections, getScheduleDateLabel } from "@/lib/retreats/schedule-sections";

export function RetreatSchedule({
  markdown,
  startDate,
  timezone,
}: {
  markdown: string;
  startDate?: string;
  timezone?: string;
}) {
  const { introduction, sections } = splitScheduleSections(markdown);
  return (
    <div className="mt-6 space-y-4">
      {introduction ? (
        <MarkdownContent className="text-muted-foreground leading-relaxed">
          {introduction}
        </MarkdownContent>
      ) : null}
      {sections.map((section, index) => (
        <details
          key={`${index}-${section.title}`}
          className="group bg-background rounded-2xl border p-5 shadow-sm"
        >
          <summary className="focus-visible:outline-brand-accent flex cursor-pointer list-none items-center gap-4 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 [&::-webkit-details-marker]:hidden">
            <span
              aria-hidden="true"
              className="bg-brand-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              {startDate ? (
                <p className="text-brand-accent mb-1 text-xs font-semibold tracking-wide uppercase">
                  {getScheduleDateLabel(startDate, index, timezone)}
                </p>
              ) : null}
              <h3 className="text-xl">{section.title}</h3>
            </div>
            <ChevronDown
              aria-hidden="true"
              className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
            />
          </summary>
          <MarkdownContent
            activityList
            className="text-muted-foreground mt-5 border-t pt-5 leading-relaxed"
          >
            {section.body}
          </MarkdownContent>
        </details>
      ))}
    </div>
  );
}
