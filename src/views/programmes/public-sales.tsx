import Link from "next/link";
import { EditorialHero } from "@/components/marketing/sections";
import { BookOpen, Dumbbell, MessageCircle, Play } from "lucide-react";
import { Layout } from "@/components/layout";
import { ProgrammePurchase } from "./sales-checkout";
import { ActionLink, ProgrammeVisual, StatusPill, eyebrow } from "./visuals";
import { dateLabel, dateRange, sessionLabel } from "@/lib/programmes/presentation";
import type { PublicProgrammeCohort } from "@/lib/programmes/public-service";
const steps = [
  { title: "Learn", detail: "One short, informal video each Monday.", Icon: BookOpen },
  {
    title: "Train together",
    detail: "One 45-minute live strength session each week.",
    Icon: Dumbbell,
  },
  {
    title: "Practise",
    detail: "One independent workout using exercises you've already learned.",
    Icon: Play,
  },
  {
    title: "Ask and reflect",
    detail: "A private group for questions, discussion and weekly prompts.",
    Icon: MessageCircle,
  },
];
export function PublicProgrammeSales({
  cohort: c,
  choices,
  preview = false,
}: {
  cohort: PublicProgrammeCohort;
  choices: PublicProgrammeCohort[];
  preview?: boolean;
}) {
  return (
    <Layout>
      {preview && (
        <p className="bg-amber-100 p-4 text-center text-amber-950">
          Staff preview — this page is not available to purchase.
        </p>
      )}
      <EditorialHero
        eyebrow="Online · Small group"
        title={c.title}
        description={
          <div className="space-y-4">
            <p>{c.subtitle}</p>
            <p className="text-base leading-relaxed">{c.summary}</p>
            <p className="text-base font-medium">
              {c.startsAt && dateRange(c.startsAt, c.endsAt, c.timezone)} · {c.durationWeeks} weeks
            </p>
            <StatusPill>{c.availability}</StatusPill>
          </div>
        }
        primaryCta={{
          href: c.bookable ? "#booking" : "#dates",
          label: c.bookable
            ? "Join the programme"
            : c.availability === "In progress"
              ? "See future dates"
              : "Keep me updated",
        }}
        secondaryCta={{ href: "/programmes", label: "All programmes" }}
        aside={
          <div className="border-brand-white/10 bg-brand-white/8 overflow-hidden rounded-[2rem] border p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
            <div className="aspect-[4/3] overflow-hidden rounded-[1.45rem]">
              <ProgrammeVisual image={c.image} alt={c.imageAlt} />
            </div>
          </div>
        }
      />
      <div className="mx-auto max-w-6xl space-y-16 px-5 py-14 md:space-y-24 md:py-20">
        <section id="dates" className="scroll-mt-24 space-y-4" aria-labelledby="dates-title">
          <h2 id="dates-title" className="text-2xl">
            Programme dates
          </h2>
          {choices.length > 1 && (
            <nav aria-label="Choose programme dates" className="flex flex-wrap gap-3">
              {choices.map((choice) => (
                <Link
                  key={choice.id}
                  href={`/programmes/${c.slug}?cohort=${choice.runSlug}`}
                  aria-current={c.id === choice.id ? "page" : undefined}
                  className={`rounded-xl border p-4 text-sm ${c.id === choice.id ? "border-primary bg-primary/5" : "border-brand-dark/15 hover:bg-secondary/40"}`}
                >
                  <span className="block font-semibold">
                    {choice.startsAt && dateRange(choice.startsAt, choice.endsAt, choice.timezone)}
                  </span>
                  <span>{choice.availability}</span>
                </Link>
              ))}
            </nav>
          )}
          {c.availability === "In progress" && (
            <p>This cohort is underway. Join the mailing list to hear about the next programme.</p>
          )}
          {!c.bookable && (
            <>
              <p>
                {c.availability === "Coming soon"
                  ? "More details and booking information are on their way."
                  : c.availability === "In progress"
                    ? "Future dates will appear here when announced."
                    : "Enrolment is not currently open."}
              </p>
              <ActionLink href="/subscribe">Join the mailing list</ActionLink>
            </>
          )}
        </section>
        {c.suitability.length > 0 && (
          <section className="grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
            <h2 className="text-3xl">This might be for you if…</h2>
            <ul className="space-y-5">
              {c.suitability.map((s, i) => (
                <li
                  key={s}
                  className="border-brand-dark/10 flex gap-4 border-b pb-5 text-lg leading-relaxed"
                >
                  <span aria-hidden="true" className="text-brand-accent">
                    0{i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="space-y-8">
          <div className="max-w-2xl space-y-3">
            <p className={eyebrow}>Support you can put into practice</p>
            <h2 className="text-3xl">How it works</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ title, detail, Icon }) => (
              <article key={title} className="bg-secondary/40 rounded-2xl p-6">
                <Icon aria-hidden="true" strokeWidth={1.5} className="text-primary mb-7 h-8 w-8" />
                <h3 className="mb-3 text-xl">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{detail}</p>
              </article>
            ))}
          </div>
        </section>
        {c.journey.length > 0 && (
          <section className="bg-brand-accent/10 rounded-3xl p-7 md:p-10">
            <h2 className="mb-8 text-3xl">Your {c.durationWeeks}-week journey</h2>
            <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {c.journey.map((title, i) => (
                <li key={title} className="space-y-4">
                  <span className="text-primary flex h-11 w-11 items-center justify-center rounded-full bg-white">
                    {i + 1}
                  </span>
                  <h3 className="text-lg leading-snug">{title}</h3>
                </li>
              ))}
            </ol>
          </section>
        )}
        {!c.teaser && (
          <>
            <section className="grid gap-12 md:grid-cols-2">
              <div className="space-y-5">
                <h2 className="text-3xl">Live sessions</h2>
                <p className="text-muted-foreground">
                  Train together online, with a recording to return to afterwards.
                </p>
                <ul className="divide-y divide-[#e4ddd9]">
                  {c.sessions.map((s) => (
                    <li className="py-4" key={s.id}>
                      <h3 className="font-semibold">{s.title}</h3>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {sessionLabel(s.startsAt, c.timezone)} · 45 minutes
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-9">
                <div className="space-y-4">
                  <h2 className="text-3xl">What you'll need</h2>
                  <p className="leading-relaxed whitespace-pre-wrap">{c.equipment}</p>
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl">Health and suitability</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Review your health information before taking part. Shruti will confirm your
                    exercise clearance, so you know how to participate safely. You can explore the
                    education and timetable while you wait.
                  </p>
                </div>
              </div>
            </section>
            <section
              id="booking"
              className="bg-secondary/40 grid scroll-mt-24 gap-10 rounded-3xl p-6 md:grid-cols-2 md:p-10"
            >
              <div className="space-y-5">
                <p className={eyebrow}>Your place in the group</p>
                <h2 className="text-3xl">Join {c.title}</h2>
                {c.pricePence != null && (
                  <p className="text-primary text-4xl">£{(c.pricePence / 100).toFixed(2)}</p>
                )}
                <p className="leading-relaxed whitespace-pre-wrap">{c.description}</p>
                <p className="text-sm">
                  Minimum {c.minimum} participants{c.maximum ? ` · Maximum ${c.maximum}` : ""}
                </p>
                {c.confirmationDeadline && (
                  <p className="text-sm">
                    Cohort confirmation: {dateLabel(c.confirmationDeadline, c.timezone)}
                  </p>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{c.refundWording}</p>
              </div>
              <div>
                {c.bookable ? (
                  <ProgrammePurchase id={c.id} version={c.agreementVersion} title={c.title} />
                ) : (
                  <div className="space-y-5 rounded-2xl bg-white p-6">
                    <StatusPill>{c.availability}</StatusPill>
                    <p>Hear about future places and new programme dates.</p>
                    <ActionLink href="/subscribe">Join the mailing list</ActionLink>
                  </div>
                )}
              </div>
            </section>
            <section className="max-w-3xl space-y-5">
              <h2 className="text-3xl">Keep going, in your own way</h2>
              <p className="leading-relaxed">
                Your coached weeks are followed by time to revisit the recordings, education and
                written workouts, and stay in touch with the group
                {c.accessEndsAt ? ` until ${dateLabel(c.accessEndsAt, c.timezone)}` : ""}. There are
                no new workouts or live coaching sessions during this follow-up period.
              </p>
            </section>
          </>
        )}
        <section className="max-w-3xl space-y-5">
          <h2 className="text-3xl">A few common questions</h2>
          {[
            [
              "Do I need to attend every live workout?",
              "No. Once the teaching recording is ready, cleared participants can use the written workout and replay even if they missed the live session.",
            ],
            [
              "When can I use my independent workout?",
              "Workouts use exercises you have already been taught. If this week's live session introduces something new, the workout becomes available after the session and its teaching recording are ready. You do not have to attend live.",
            ],
            [
              "What happens while my health information is being reviewed?",
              "You can explore educational material, the timetable and community when it opens. Exercise sessions and workouts unlock after clearance.",
            ],
            [
              "What if the minimum number is not reached?",
              "Shruti will review the cohort at the confirmation deadline and let you know whether it will run. The published cancellation policy explains refunds if it is cancelled.",
            ],
          ].map(([q, a]) => (
            <details className="border-brand-dark/10 border-b pb-5" key={q}>
              <summary className="cursor-pointer py-2 text-lg">{q}</summary>
              <p className="text-muted-foreground pt-3 leading-relaxed">{a}</p>
            </details>
          ))}
        </section>
      </div>
    </Layout>
  );
}
