import type { TestimonialContent } from "@/lib/content/types";

export function TestimonialQuotes({
  testimonials,
  title = "What it’s like to join me",
}: {
  testimonials: TestimonialContent[];
  title?: string;
}) {
  if (!testimonials.length) return null;
  return (
    <section aria-label={title} className="space-y-6">
      <h2 className="text-3xl">{title}</h2>
      <div className="grid gap-5 md:grid-cols-2">
        {testimonials.slice(0, 3).map((item) => (
          <figure key={item.id} className="border-brand-accent/20 rounded-2xl border bg-white p-6">
            <blockquote className="text-lg leading-relaxed">“{item.quote}”</blockquote>
            <figcaption className="mt-4">
              <span className="font-medium">{item.authorName}</span>
              {item.contextLabel ? (
                <span className="text-muted-foreground mt-1 block text-sm">
                  {item.contextLabel}
                </span>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
