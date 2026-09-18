import { EditorialHero, MarketingSection } from "@/components/marketing/sections";
import { Layout } from "@/components/layout";
import { ActionLink, ProgrammeVisual, StatusPill, cardSurface } from "./visuals";
import { dateRange } from "@/lib/programmes/presentation";
import type { getProgrammeCatalogue } from "@/lib/programmes/public-service";
export function PublicProgrammeCatalogue({
  data,
}: {
  data: Awaited<ReturnType<typeof getProgrammeCatalogue>>;
}) {
  return (
    <Layout>
      <EditorialHero
        size="compact"
        eyebrow="Programmes"
        title="Build strength. Find your approach."
        description={data.intro}
        aside={
          <div className="border-brand-white/10 bg-brand-white/8 overflow-hidden rounded-[2rem] border p-3">
            <div className="aspect-[4/3] overflow-hidden rounded-[1.45rem]">
              <ProgrammeVisual
                image={data.programmes[0]?.image}
                alt={data.programmes[0]?.imageAlt}
              />
            </div>
          </div>
        }
      />
      <MarketingSection className="section-wash">
        {data.programmes.length ? (
          <div className="space-y-8">
            {data.programmes.map((c) => (
              <article
                key={c.programmeId}
                className={`${cardSurface} grid md:grid-cols-[0.85fr_1.15fr]`}
              >
                <ProgrammeVisual image={c.image} alt={c.imageAlt} />
                <div className="space-y-5 p-7 md:p-10">
                  <StatusPill>{c.availability}</StatusPill>
                  <div className="space-y-2">
                    <h2 className="text-3xl">{c.title}</h2>
                    <p className="text-primary text-lg">{c.subtitle}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold">
                      {c.startsAt && dateRange(c.startsAt, c.endsAt, c.timezone)}
                    </p>
                    <p className="text-muted-foreground">
                      {c.durationWeeks} weeks · Online · Small group
                    </p>
                  </div>
                  <p className="text-muted-foreground max-w-xl leading-relaxed">{c.summary}</p>
                  <ActionLink href={`/programmes/${c.slug}`}>Find out more</ActionLink>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="max-w-2xl rounded-2xl bg-white p-8 md:p-12">
            <p className="text-primary mb-3 text-sm font-medium">New programmes coming soon</p>
            <h2 className="text-2xl">No programmes are currently open for booking.</h2>
            <p className="text-muted-foreground my-5 leading-relaxed">{data.empty}</p>
            <ActionLink href="/subscribe">Join the mailing list</ActionLink>
          </div>
        )}
        {data.programmes.length > 0 && !data.programmes.some((c) => c.bookable) && (
          <p className="text-muted-foreground mt-8">
            Bookings aren't open right now. Join the mailing list to hear when places become
            available.
          </p>
        )}
      </MarketingSection>
    </Layout>
  );
}
