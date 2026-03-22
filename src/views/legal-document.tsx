"use client";

import { Layout } from "@/components/layout";
import { MarketingSection } from "@/components/marketing/sections";
import type { LegalDocumentContent } from "@/lib/content";

interface LegalDocumentPageProps {
  document: LegalDocumentContent;
}

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  const effectiveDate = document.effectiveDate
    ? new Date(document.effectiveDate).toLocaleDateString("en-GB")
    : null;

  return (
    <Layout>
      <section className="marketing-grid overflow-hidden px-4 py-10 text-brand-white md:py-12">
        <div className="container mx-auto max-w-5xl">
          <p className="text-brand-accent-light text-xs tracking-[0.3em] uppercase">
            Legal Information
          </p>
          <h1 className="mt-4 text-4xl leading-[1.08] tracking-[-0.03em] md:text-5xl">
            {document.title}
          </h1>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-brand-white/72">
            <span className="rounded-full border border-brand-white/12 bg-brand-white/8 px-4 py-2">
              Version: {document.version}
            </span>
            {effectiveDate ? (
              <span className="rounded-full border border-brand-white/12 bg-brand-white/8 px-4 py-2">
                Effective: {effectiveDate}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <MarketingSection className="section-wash" contentClassName="max-w-4xl" compact>
        <article className="marketing-panel rounded-[2rem] p-6 md:p-8">
          <div className="prose prose-lg text-muted-foreground max-w-none">
            <div className="leading-relaxed whitespace-pre-line">{document.body}</div>
          </div>
        </article>
      </MarketingSection>
    </Layout>
  );
}
