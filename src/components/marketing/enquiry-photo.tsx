import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

export function EnquiryPhoto() {
  return (
    <aside className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
      <div className="overflow-hidden rounded-[2rem]">
        <ImageWithFallback
          src="/images/shruti-coaching.jpeg"
          alt="Shruti outdoors beside the water"
          className="aspect-[4/5] w-full object-cover"
          sizes="40vw"
        />
      </div>
      <p className="text-brand-accent mt-6 text-sm">A conversation with Shruti</p>
      <h2 className="mt-2 text-3xl">Let’s start where you are.</h2>
      <p className="text-muted-foreground mt-3 leading-relaxed">
        Share what’s on your mind, ask a question, or tell me what you’d like support with.
      </p>
    </aside>
  );
}
