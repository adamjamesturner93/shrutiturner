import Image from "next/image";
import Link from "next/link";
import { IconVertical } from "@/components/icon";

const LAST_UPDATED_LABEL = "13 April 2026";

export function HoldingPrivacyPage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#3c2c42] text-white">
      <Image
        src="/images/holding-background.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-[rgba(56,38,64,0.88)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_48%),linear-gradient(180deg,rgba(44,29,50,0.74)_0%,rgba(44,29,50,0.92)_100%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col items-center pt-4 text-center sm:pt-6">
          <IconVertical tone="white" alt="Shruti Turner" className="h-24 w-auto sm:h-28" />
        </header>

        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-10">
          <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-[0_24px_70px_rgba(8,4,12,0.28)] backdrop-blur-md sm:p-8">
            <h1 className="font-heading text-4xl tracking-[-0.03em] text-white sm:text-5xl">
              Privacy
            </h1>
            <p className="mt-4 text-sm text-white/62 italic">Last updated: {LAST_UPDATED_LABEL}</p>

            <div className="mt-8 space-y-7 text-sm leading-7 text-white/80 sm:text-base">
              <section>
                <h2 className="font-heading text-2xl text-white">What we collect</h2>
                <p className="mt-3">
                  When you join the holding-page mailing list, we collect your first name, email
                  address, consent confirmation, consent timing, verification status, unsubscribe
                  status, and limited delivery metadata needed to send and manage those emails.
                </p>
              </section>

              <section>
                <h2 className="font-heading text-2xl text-white">Why we collect it</h2>
                <p className="mt-3">
                  We use this information to send launch updates, confirm your double opt-in
                  request, deliver the free guide after verification, and maintain a suppression
                  record if you unsubscribe.
                </p>
              </section>

              <section>
                <h2 className="font-heading text-2xl text-white">Legal basis</h2>
                <p className="mt-3">
                  The legal basis for these holding-page emails is consent. You are only added to
                  the mailing list after you confirm your email using the verification link we send.
                </p>
              </section>

              <section>
                <h2 className="font-heading text-2xl text-white">Who processes it</h2>
                <p className="mt-3">
                  We use Postmark to send verification and follow-up emails, Cloudflare Turnstile to
                  reduce form abuse, and our application database to store your subscription status
                  and email preference history.
                </p>
              </section>

              <section>
                <h2 className="font-heading text-2xl text-white">How long we keep it</h2>
                <p className="mt-3">
                  Pending verification records are kept only while the confirmation link remains
                  valid and while operational cleanup is needed. Confirmed subscriber records are
                  kept until you unsubscribe. Unsubscribe records may be retained so we do not email
                  you again in error.
                </p>
              </section>

              <section>
                <h2 className="font-heading text-2xl text-white">Your choices</h2>
                <p className="mt-3">
                  You can unsubscribe at any time using the link included in holding-page emails.
                  You can also request access, correction, or deletion by contacting{" "}
                  <a
                    href="mailto:tech@thechronicyogini.com"
                    className="underline decoration-white/35 underline-offset-4"
                  >
                    tech@thechronicyogini.com
                  </a>
                  .
                </p>
              </section>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white/68">
              <Link href="/" className="underline decoration-white/35 underline-offset-4">
                Back
              </Link>
              <a
                href="mailto:tech@thechronicyogini.com"
                className="underline decoration-white/35 underline-offset-4"
              >
                Contact privacy support
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
