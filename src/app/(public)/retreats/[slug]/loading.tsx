export default function RetreatDetailLoading() {
  return (
    <div role="status" aria-label="Loading retreat details" aria-live="polite">
      <section className="marketing-grid overflow-hidden px-4 py-12 md:py-16">
        <div className="container mx-auto max-w-6xl">
          <div className="grid items-center gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10">
            <div className="space-y-5" aria-hidden="true">
              <div className="bg-brand-white/12 h-4 w-48 animate-pulse rounded-full" />
              <div className="bg-brand-white/12 h-4 w-32 animate-pulse rounded-full" />
              <div className="space-y-3">
                <div className="bg-brand-white/16 h-12 w-full max-w-lg animate-pulse rounded-xl" />
                <div className="bg-brand-white/12 h-7 w-4/5 max-w-md animate-pulse rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="bg-brand-white/10 h-4 w-full max-w-xl animate-pulse rounded-full" />
                <div className="bg-brand-white/10 h-4 w-5/6 max-w-lg animate-pulse rounded-full" />
              </div>
            </div>
            <div
              className="border-brand-white/10 bg-brand-white/8 aspect-[4/3] animate-pulse rounded-[2rem] border"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>

      <section className="section-wash px-4 py-16 md:py-20">
        <div className="container mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-7" aria-hidden="true">
            <div className="space-y-3">
              <div className="bg-brand-dark/10 h-8 w-56 animate-pulse rounded-lg" />
              <div className="bg-brand-dark/8 h-4 w-full animate-pulse rounded-full" />
              <div className="bg-brand-dark/8 h-4 w-4/5 animate-pulse rounded-full" />
            </div>
            <div className="border-brand-dark/8 bg-background h-48 animate-pulse rounded-[1.75rem] border" />
          </div>
          <div
            className="border-brand-dark/8 bg-background h-96 animate-pulse rounded-[1.9rem] border"
            aria-hidden="true"
          />
        </div>
      </section>
      <span className="sr-only">Loading retreat details…</span>
    </div>
  );
}
