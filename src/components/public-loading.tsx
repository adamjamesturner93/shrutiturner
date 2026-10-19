import { Layout } from "@/components/layout";
import { LoadingRegion } from "@/components/loading-region";
import { Skeleton } from "@/components/ui/skeleton";

export function PublicPageLoading({ label = "Loading page" }: { label?: string }) {
  return (
    <Layout showFooterNewsletter={false}>
      <LoadingRegion label={label}>
        <section className="section-wash px-4 py-14 md:py-20">
          <div className="container mx-auto max-w-6xl space-y-10">
            <div className="max-w-3xl space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-14 w-full max-w-2xl" />
              <Skeleton className="h-5 w-full max-w-xl" />
              <Skeleton className="h-5 w-4/5 max-w-lg" />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-44 rounded-[1.75rem]" />
              ))}
            </div>
          </div>
        </section>
      </LoadingRegion>
    </Layout>
  );
}

export function BlogPostPageLoading() {
  return (
    <Layout showFooterNewsletter={false}>
      <LoadingRegion label="Loading article">
        <section className="marketing-grid px-4 py-12 md:py-16">
          <div className="container mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-5">
              <Skeleton className="h-4 w-28 bg-white/12" />
              <Skeleton className="h-4 w-56 bg-white/12" />
              <Skeleton className="h-12 w-full bg-white/15" />
              <Skeleton className="h-12 w-4/5 bg-white/15" />
              <Skeleton className="h-5 w-48 bg-white/12" />
            </div>
            <Skeleton className="aspect-[4/3] rounded-[2rem] bg-white/10" />
          </div>
        </section>
        <section className="px-4 py-14 md:py-20">
          <div className="container mx-auto max-w-3xl space-y-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className={index % 3 === 2 ? "h-4 w-4/5" : "h-4 w-full"} />
            ))}
          </div>
        </section>
      </LoadingRegion>
    </Layout>
  );
}

export function UtilityFormPageLoading({ label }: { label: string }) {
  return (
    <Layout footerVariant="utility" showFooterNewsletter={false}>
      <LoadingRegion label={label}>
        <section className="section-wash min-h-[70vh] px-4 py-12">
          <div className="container mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
            <div className="marketing-grid space-y-5 rounded-[2rem] p-8">
              <Skeleton className="h-4 w-32 bg-white/12" />
              <Skeleton className="h-12 w-4/5 bg-white/15" />
              <Skeleton className="h-5 w-full bg-white/12" />
              <Skeleton className="h-5 w-3/4 bg-white/12" />
            </div>
            <div className="bg-background space-y-5 rounded-[2rem] border p-8">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-11 w-full rounded-full" />
            </div>
          </div>
        </section>
      </LoadingRegion>
    </Layout>
  );
}

export function RetreatCheckoutPageLoading() {
  return (
    <Layout footerVariant="utility" showFooterNewsletter={false}>
      <LoadingRegion label="Loading retreat checkout">
        <section className="marketing-grid px-4 py-6">
          <div className="mx-auto max-w-6xl space-y-4">
            <Skeleton className="h-4 w-40 bg-white/15" />
            <Skeleton className="h-9 w-full max-w-lg bg-white/15" />
            <Skeleton className="h-5 w-3/4 max-w-xl bg-white/15" />
          </div>
        </section>
        <section className="section-wash px-4 py-6">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="bg-background space-y-5 rounded-[1.9rem] border p-6">
              <Skeleton className="aspect-video w-full rounded-2xl" />
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
            <div className="bg-background space-y-5 rounded-[1.9rem] border p-6">
              <Skeleton className="h-8 w-1/2" />
              {[0, 1, 2].map((field) => (
                <Skeleton key={field} className="h-16 w-full rounded-xl" />
              ))}
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </section>
      </LoadingRegion>
    </Layout>
  );
}

export function RetreatBalancePageLoading() {
  return <UtilityFormPageLoading label="Loading balance payment" />;
}

export function GiftRedeemPageLoading() {
  return <UtilityFormPageLoading label="Loading gift redemption" />;
}

export function LoginPageLoading() {
  return <UtilityFormPageLoading label="Loading sign in" />;
}

export function CoachingPageLoading() {
  return (
    <Layout showFooterNewsletter={false}>
      <LoadingRegion label="Loading coaching">
        <section className="bg-brand-dark px-4 py-24 md:py-32">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6">
            <Skeleton className="h-4 w-40 bg-white/15" />
            <Skeleton className="h-24 w-full rounded-xl bg-white/15" />
            <Skeleton className="h-14 w-4/5 bg-white/10" />
            <div className="flex w-full max-w-lg flex-col gap-4 sm:flex-row">
              <Skeleton className="h-12 flex-1 bg-white/20" />
              <Skeleton className="h-12 flex-1 bg-white/10" />
            </div>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 md:grid-cols-3">
          {[0, 1, 2].map((card) => (
            <Skeleton key={card} className="h-72 rounded-[2rem]" />
          ))}
        </section>
      </LoadingRegion>
    </Layout>
  );
}

export function RetreatsPageLoading() {
  return (
    <Layout showFooterNewsletter={false}>
      <LoadingRegion label="Loading retreats and workshops">
        <section className="section-wash px-4 py-16">
          <div className="mx-auto max-w-7xl space-y-6">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-16 w-full max-w-3xl" />
            <Skeleton className="h-12 w-4/5 max-w-2xl" />
          </div>
        </section>
        <section className="mx-auto max-w-7xl space-y-8 px-4 py-16">
          <Skeleton className="h-10 w-56" />
          <div className="grid gap-7 md:grid-cols-2">
            {[0, 1].map((card) => (
              <div key={card} className="overflow-hidden rounded-[1.5rem] border">
                <Skeleton className="aspect-video w-full rounded-none" />
                <div className="space-y-5 p-6">
                  <Skeleton className="h-8 w-4/5" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-20 w-3/4" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </LoadingRegion>
    </Layout>
  );
}

export function RetreatDetailPageLoading() {
  return (
    <Layout showFooterNewsletter={false}>
      <LoadingRegion label="Loading retreat details">
        <section className="bg-brand-dark px-4 py-8">
          <div className="mx-auto max-w-7xl">
            <Skeleton className="h-4 w-2/3 max-w-sm bg-white/15" />
            <div className="mx-auto flex min-h-[30rem] max-w-4xl flex-col items-center justify-center gap-6 py-12 md:min-h-[34rem]">
              <Skeleton className="h-5 w-32 bg-white/15" />
              <Skeleton className="h-24 w-full bg-white/15" />
              <Skeleton className="h-14 w-4/5 bg-white/10" />
              <Skeleton className="h-10 w-3/4 bg-white/10" />
              <Skeleton className="h-12 w-48 bg-white/20" />
            </div>
          </div>
        </section>
        <div className="border-b px-4 py-5">
          <Skeleton className="mx-auto h-6 w-full max-w-7xl" />
        </div>
        <section className="section-wash px-4 py-12">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_25rem]">
            <div className="space-y-8">
              <Skeleton className="h-40 rounded-[2rem]" />
              <Skeleton className="h-64 rounded-[2rem]" />
            </div>
            <Skeleton className="h-[32rem] rounded-[2rem]" />
          </div>
        </section>
      </LoadingRegion>
    </Layout>
  );
}
