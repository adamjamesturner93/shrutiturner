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
  return <UtilityFormPageLoading label="Loading retreat checkout" />;
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
