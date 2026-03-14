"use client";

import { Layout } from "@/components/layout";
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
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <h1 className="mb-4 text-4xl md:text-5xl">{document.title}</h1>
        <div className="text-brand-accent mb-10 flex flex-wrap gap-4 text-sm">
          <span>Version: {document.version}</span>
          {effectiveDate ? <span>Effective: {effectiveDate}</span> : null}
        </div>

        <div className="prose prose-lg text-muted-foreground max-w-none">
          <div className="leading-relaxed whitespace-pre-line">{document.body}</div>
        </div>
      </div>
    </Layout>
  );
}
