"use client";

import { Layout } from "@/components/layout";
import { MarketingSection } from "@/components/marketing/sections";
import { PublicBreadcrumbs } from "@/components/public-breadcrumbs";
import type { LegalDocumentContent } from "@/lib/content/types";
import { parseLegalDocumentBody } from "@/lib/content/structured-text";

interface LegalDocumentPageProps {
  document: LegalDocumentContent;
}

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  const effectiveDate = document.effectiveDate
    ? new Date(document.effectiveDate).toLocaleDateString("en-GB")
    : null;
  const blocks = parseLegalDocumentBody(document.body);

  return (
    <Layout footerVariant="utility">
      <section className="marketing-grid text-brand-white overflow-hidden px-4 py-10 md:py-12">
        <div className="container mx-auto max-w-5xl">
          <PublicBreadcrumbs
            inverted
            className="mb-7"
            items={[
              { name: "Home", href: "/" },
              { name: document.title, href: `/${document.slug}` },
            ]}
          />
          <p className="text-brand-accent-light text-xs tracking-[0.3em] uppercase">
            Legal Information
          </p>
          <h1 className="mt-4 text-4xl leading-[1.08] tracking-[-0.03em] md:text-5xl">
            {document.title}
          </h1>
          <div className="text-brand-white/72 mt-5 flex flex-wrap gap-3 text-sm">
            <span className="border-brand-white/12 bg-brand-white/8 rounded-full border px-4 py-2">
              Version: {document.version}
            </span>
            {effectiveDate ? (
              <span className="border-brand-white/12 bg-brand-white/8 rounded-full border px-4 py-2">
                Effective: {effectiveDate}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <MarketingSection className="section-wash" contentClassName="max-w-4xl" compact>
        <article className="marketing-panel rounded-[2rem] p-6 md:p-8">
          <div className="prose prose-lg text-muted-foreground max-w-none leading-relaxed">
            {blocks.map((block, index) => {
              if (block.type === "heading") {
                const id = `section-${index + 1}`;
                return block.level === 3 ? (
                  <h3 id={id} key={id}>
                    {block.text}
                  </h3>
                ) : (
                  <h2 id={id} key={id}>
                    {block.text}
                  </h2>
                );
              }
              if (block.type === "unordered-list") {
                return (
                  <ul key={`list-${index}`}>
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                );
              }
              if (block.type === "ordered-list") {
                return (
                  <ol key={`list-${index}`}>
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                );
              }
              return <p key={`paragraph-${index}`}>{block.text}</p>;
            })}
          </div>
        </article>
      </MarketingSection>
    </Layout>
  );
}
