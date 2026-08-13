import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, Mail, Youtube } from "lucide-react";
import { HoldingNewsletterForm } from "@/components/holding-newsletter-form";
import { IconVertical } from "@/components/icon";

interface HoldingPageProps {
  existingPlatformUrl: string;
}

const SOCIAL_LINKS = [
  {
    href: "https://instagram.com/shrutiturner",
    icon: Instagram,
    label: "Instagram",
  },
  {
    href: "https://youtube.com/@shrutiturner",
    icon: Youtube,
    label: "YouTube",
  },
  {
    href: "https://facebook.com/profile.php?id=61556124191934",
    icon: Facebook,
    label: "Facebook",
  },
  {
    href: "mailto:shruti@shrutiturner.co.uk",
    icon: Mail,
    label: "Email",
  },
] as const;

export function HoldingPage({ existingPlatformUrl: _existingPlatformUrl }: HoldingPageProps) {
  void _existingPlatformUrl;
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
      <div className="absolute inset-0 bg-[rgba(56,38,64,0.82)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_48%),linear-gradient(180deg,rgba(44,29,50,0.72)_0%,rgba(44,29,50,0.88)_100%)]" />
      <div className="absolute top-[32%] -left-24 h-72 w-72 rounded-full border border-white/6" />
      <div className="absolute top-[28%] right-[8%] h-72 w-72 rounded-full border border-white/7" />
      <div className="absolute inset-x-0 bottom-[18%] h-px bg-white/8" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <header className="flex flex-col items-center pt-1 text-center sm:pt-2">
          <IconVertical tone="white" alt="Shruti Turner" className="h-24 w-auto sm:h-28" />
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 items-center pt-5 pb-4 sm:pt-6">
          <div className="grid w-full gap-6 md:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] md:items-center md:gap-8">
            <div className="mx-auto flex w-full max-w-2xl flex-col text-center md:mx-0 md:text-left">
              <p className="text-brand-accent-light/78 text-[0.68rem] tracking-[0.32em] uppercase">
                Launching Soon
              </p>
              <h1 className="font-heading mt-4 text-[3rem] leading-[0.95] tracking-[-0.03em] text-white sm:text-[3.5rem] lg:text-[4rem]">
                Something new is coming
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/82 sm:text-[1.12rem] sm:leading-[1.6] lg:max-w-2xl lg:text-[1.22rem]">
                A new home for evidence-based coaching and resources launching{" "}
                <span className="text-brand-accent-light">early summer 2026</span>.
              </p>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/62 sm:text-[0.96rem] lg:max-w-xl">
                Join the list for launch updates and a free guide now.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row md:flex-col md:items-start lg:flex-row">
                <p className="max-w-sm text-sm leading-relaxed text-white/58">
                  Coaching enquiries, resources and newsletter updates will live here when the new
                  site opens.
                </p>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[420px] md:mx-0 md:justify-self-end">
              <HoldingNewsletterForm />
            </div>
          </div>
        </main>

        <footer className="pt-3 pb-2">
          <div className="flex flex-col items-center justify-center gap-4 border-t border-white/10 pt-4 text-center lg:flex-row lg:justify-between lg:text-left">
            <div className="flex items-center gap-4">
              {SOCIAL_LINKS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  aria-label={item.label}
                  className="text-white/60 transition hover:text-white"
                >
                  <item.icon className="h-4 w-4" />
                </a>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/55">
              <Link href="/privacy" className="transition hover:text-white">
                Privacy
              </Link>
            </div>

            <p className="text-xs text-white/40">© 2026 Shruti Turner</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
