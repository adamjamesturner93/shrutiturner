import Image from "next/image";
import { BookOpen, Dumbbell, MessageCircle, Video } from "lucide-react";
import { EditorialHero, MarketingSection, SectionHeading } from "@/components/marketing/sections";
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
        primaryCta={{
          href: "#explore-programmes",
          label: data.programmes.length ? "Explore programmes" : "Hear about the next programme",
        }}
        secondaryCta={{ href: "#how-programmes-work", label: "How programmes work" }}
        aside={
          <div className="border-brand-white/10 bg-brand-white/8 overflow-hidden rounded-[2rem] border p-3">
            <div className="relative h-[24rem] w-full overflow-hidden rounded-[1.45rem] sm:h-[30rem]">
              <Image
                src="/images/shruti-coaching.jpeg"
                alt="Shruti walking beside the sea"
                fill
                sizes="(min-width: 1024px) 520px, 100vw"
                preload
                className="object-cover object-[45%_45%]"
              />
            </div>
          </div>
        }
      />
      <MarketingSection id="how-programmes-work" className="section-wash scroll-mt-28">
        <div className="grid gap-8 md:grid-cols-[1fr_0.9fr] md:gap-16">
          <SectionHeading
            eyebrow="A little structure. Room to be yourself."
            title="Learn together. Make it your own."
          />
          <div className="text-muted-foreground space-y-4 text-lg leading-relaxed">
            <p>
              My programmes bring a small group together for a few weeks to explore a particular
              aspect of strength or movement. There is a clear beginning and end, a shared focus,
              and time to put what you learn into practice.
            </p>
            <p>
              Expect practical education, adaptable training and space to ask questions. The aim is
              to leave with more understanding and confidence to keep going in a way that works for
              you.
            </p>
          </div>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: BookOpen,
              title: "Understand",
              body: "Short, informal lessons help you understand the thinking behind your training.",
            },
            {
              icon: Video,
              title: "Train together",
              body: "Live online sessions offer a chance to learn with Shruti and your group.",
            },
            {
              icon: Dumbbell,
              title: "Make time to practise",
              body: "Written workouts help you revisit exercises you have learned, in your own time.",
            },
            {
              icon: MessageCircle,
              title: "Ask and reflect",
              body: "A private cohort space brings questions, shared experiences and weekly reflections together.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <article key={title} className="border-brand-accent/25 border-t pt-6">
              <Icon aria-hidden="true" className="text-primary mb-5 h-7 w-7" />
              <h3 className="mb-3 text-2xl">{title}</h3>
              <p className="text-muted-foreground leading-relaxed">{body}</p>
            </article>
          ))}
        </div>
        <p className="text-muted-foreground mt-8 text-sm">
          Each programme page explains its schedule, equipment, suitability and exactly what is
          included.
        </p>
      </MarketingSection>
      <MarketingSection id="explore-programmes" className="scroll-mt-28" compact>
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
          <div className="bg-secondary grid items-center gap-8 rounded-[2rem] p-8 md:grid-cols-[1.2fr_0.8fr] md:p-12">
            <div>
              <p className="text-primary mb-3 text-sm font-medium">New programmes coming soon</p>
              <h2 className="text-2xl">No programmes are currently open for booking.</h2>
              <p className="text-muted-foreground my-5 leading-relaxed">{data.empty}</p>
            </div>
            <div className="md:border-brand-dark/10 space-y-5 md:border-l md:pl-10">
              <p className="text-lg">
                Be the first to hear about new dates and what we will be exploring next.
              </p>
              <ActionLink href="/subscribe">Join the mailing list</ActionLink>
            </div>
          </div>
        )}
        {data.programmes.length > 0 && !data.programmes.some((c) => c.bookable) && (
          <p className="text-muted-foreground mt-8">
            Bookings aren't open right now. Join the mailing list to hear when places become
            available.
          </p>
        )}
      </MarketingSection>
      <MarketingSection compact>
        <SectionHeading title="A few things you might be wondering" />
        <div className="mt-8 divide-y">
          {[
            [
              "Do I need to be at a particular fitness level?",
              "Each programme has its own focus and suitability guidance. Adaptations are part of the approach. Read the programme details and get in touch if you are unsure whether it is a good fit.",
            ],
            [
              "What if I cannot attend every live session?",
              "Check the individual programme for recording availability and access dates. Independent practice fits around your week, and attending a live session is not a condition for accessing a workout once its teaching is available.",
            ],
            [
              "What happens after the programme ends?",
              "Each programme sets out when coached sessions finish and how long you can keep using its resources. Any follow-up access is a chance to revisit what you have learned, with no further weekly workouts or live sessions.",
            ],
            [
              "How do I get started?",
              "When bookings open, choose a programme and book through this website. Your place will appear in My Studio, where you can complete your health information and agreements before exercise participation.",
            ],
          ].map(([question, answer]) => (
            <details key={question} className="py-5">
              <summary className="cursor-pointer rounded text-lg font-medium focus-visible:outline-2 focus-visible:outline-offset-4">
                {question}
              </summary>
              <p className="text-muted-foreground mt-4 max-w-3xl leading-relaxed">{answer}</p>
            </details>
          ))}
        </div>
      </MarketingSection>
    </Layout>
  );
}
